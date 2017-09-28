'use strict';

const apiKey = require('../models/api-key.js');
const encryption = require('../helpers/encryption.js');
const password = require('../helpers/password.js');
const qrCode = require('qrcode');
const response = require('../helpers/response.js');
const speakeasy = require('speakeasy');
const uuid = require('uuid');

module.exports.create = (apiKeyValue, apiSecret, {issuer, label = 'SecretKey'} = {}, callback) => {
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to create TOTP:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const otpSecrets = speakeasy.generateSecret();
    let otpAuthUrlOptions = {
      'label': label,
      'secret': otpSecrets.base32,
      'encoding': 'base32'
    };
    if (issuer) {
      otpAuthUrlOptions.issuer = issuer;
      otpAuthUrlOptions.label = issuer + ':' + label;
    }
    
    const otpAuthUrl = speakeasy.otpauthURL(otpAuthUrlOptions);
    qrCode.toDataURL(otpAuthUrl, function(error, dataUrl) {
      if (error) {
        console.error('Failed to generate QR code.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      const totpKey = otpSecrets.base32;
      var totpUuid = uuid.v4();
      apiKeyRecord.totp = apiKeyRecord.totp || {};
      while (apiKeyRecord.totp[totpUuid]) {
        console.log('Initial UUID was already in use. Generating a new one.');
        totpUuid = uuid.v4();
      }
      apiKeyRecord.totp[totpUuid] = {
        'encryptedTotpKey': encryption.encrypt(totpKey, apiSecret)
      };
      apiKey.updateApiKeyRecord(apiKeyRecord, (error) => {
        if (error) {
          console.error('Failed to create new TOTP entry.', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }
        
        const apiResponse = {
          'uuid': totpUuid,
          'totpKey': totpKey,
          'otpAuthUrl': otpAuthUrl,
          'imageUrl': dataUrl
        };
        response.returnSuccess(apiResponse, callback);
        return;
      });
    });
  });
};

module.exports.delete = (apiKeyValue, apiSecret, totpUuid, callback) => {
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to delete TOTP:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!totpUuid) {
      console.log('TOTP delete request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!apiKeyRecord.totp || !apiKeyRecord.totp[totpUuid]) {
      console.log('API Key has no such TOTP uuid.');
      response.returnError(404, 'No TOTP entry found with that uuid for that API Key.', callback);
      return;
    }
    
    delete apiKeyRecord.totp[totpUuid];
    
    apiKey.updateApiKeyRecord(apiKeyRecord, (error) => {
      if (error) {
        console.error('Error while deleting TOTP entry.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      response.returnSuccess(null, callback);
      return;
    });
  });
};

module.exports.validate = (apiKeyValue, apiSecret, totpUuid, code, callback) => {
  
  if (!totpUuid) {
    console.log('TOTP validate request had no UUID.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }
  
  if (!code) {
    response.returnError(400, 'code (as a string) is required', callback);
    return;
  }
  
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to validate TOTP:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!apiKeyRecord.totp || !apiKeyRecord.totp[totpUuid]) {
      console.log('API Key has no such TOTP uuid.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const encryptedTotpKey = apiKeyRecord.totp[totpUuid].encryptedTotpKey;
    if (!encryptedTotpKey) {
      console.error('No encryptedTotpKey found in that TOTP record.');
      response.returnError(500, 'Internal Server Error', callback);
      return;
    }
    
    encryption.decrypt(encryptedTotpKey, apiSecret, (error, totpKey) => {
      if (error) {
        console.error('Error validating TOTP code.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      const isValid = speakeasy.totp.verify({
        secret: totpKey,
        encoding: 'base32',
        token: code,
        window: 1 // 1 means compare against previous, current, and next.
      });
      
      if (!isValid) {
        console.log('Invalid TOTP code.');
        response.returnError(401, 'Invalid', callback);
        return;
      }
      
      console.log('Valid TOTP code.');
      response.returnSuccess({'message': 'Valid', 'status': 200}, callback);
      return;
    });
  });
};
