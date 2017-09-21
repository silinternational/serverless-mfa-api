'use strict';

const apiKey = require('../models/api-key.js');
const encryption = require('../helpers/encryption.js');
const qrCode = require('qrcode');
const response = require('../helpers/response.js');
const speakeasy = require('speakeasy');
const uuid = require('uuid');

module.exports.create = (requestHeaders, callback) => {
  
  // NOTE: AWS lowercases these custom header names before handing them to us.
  const requestApiKeyValue = requestHeaders['x-totp-apikey'];
  if (!requestApiKeyValue) {
    console.log('TOTP create request had no API Key.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }
  
  const requestApiSecret = requestHeaders['x-totp-apisecret'];
  if (!requestApiSecret) {
    console.log('TOTP create request had no API Secret.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }
  
  apiKey.getApiKeyByValue(requestApiKeyValue, (error, apiKeyRecord) => {
    if (error) {
      console.error(error);
      response.returnError(500, 'Failed to retrieve API Key.', callback);
      return;
    }
    
    if (!apiKeyRecord) {
      console.log('No such API Key found:', requestApiKeyValue);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!apiKey.isAlreadyActivated(apiKeyRecord)) {
      console.log('API Key has not yet been activated.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const otpSecrets = speakeasy.generateSecret();
    qrCode.toDataURL(otpSecrets.otpauth_url, function(error, dataUrl) {
      if (error) {
        console.error(error);
        response.returnError(500, 'Failed to generate QR code.', callback);
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
        'encryptedTotpKey': encryption.encrypt(totpKey, requestApiSecret)
      };
      apiKey.updateApiKeyRecord(apiKeyRecord, (error) => {
        if (error) {
          console.error(error);
          response.returnError(500, 'Failed to create new TOTP entry.', callback);
          return;
        }
        
        const apiResponse = {
          'uuid': totpUuid,
          'totpKey': totpKey,
          'imageUrl': dataUrl
        };
        response.returnSuccess(apiResponse, callback);
        return;
      });
    });
  });
};

module.exports.validate = (pathParameters, requestHeaders, requestBody, callback) => {
  
  const requestApiKeyValue = requestHeaders['x-totp-apikey'];
  if (!requestApiKeyValue) {
    console.log('TOTP validate request had no API Key.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }

  const requestApiSecret = requestHeaders['x-totp-apisecret'];
  if (!requestApiSecret) {
    console.log('TOTP validate request had no API Secret.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }
  
  const totpUuid = pathParameters.uuid;
  if ((!totpUuid) || typeof totpUuid !== 'string') {
    console.log('TOTP validate request had no UUID string in the URL.');
    response.returnError(401, 'Unauthorized', callback);
    return;
  }
  
  /* @TODO Make sure we were given a JSON body. */
  
  const data = JSON.parse(requestBody);
  if ((!data.code) || typeof data.code !== 'string') {
    response.returnError(400, 'code (as a string) is required', callback);
    return;
  }
  
  apiKey.getApiKeyByValue(requestApiKeyValue, (error, apiKeyRecord) => {
    if (error) {
      console.error('Failed to retrieve API Key.', error);
      response.returnError(500, 'Error validating TOTP code.', callback);
      return;
    }
    
    if (!apiKeyRecord) {
      console.log('No such API Key found:', requestApiKeyValue);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!apiKey.isAlreadyActivated(apiKeyRecord)) {
      console.log('API Key has not yet been activated.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!apiKeyRecord.totp[totpUuid]) {
      console.log('API Key has no such TOTP uuid.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const encryptedTotpKey = apiKeyRecord.totp[totpUuid].encryptedTotpKey;
    if (!encryptedTotpKey) {
      console.error('No encryptedTotpKey found in that TOTP record.');
      response.returnError(500, 'Error validating TOTP code.', callback);
      return;
    }
    
    encryption.decrypt(encryptedTotpKey, requestApiSecret, (error, totpKey) => {
      if (error) {
        console.error(error);
        response.returnError(500, 'Error validating TOTP code.', callback);
        return;
      }
      
      const isValid = speakeasy.totp.verify({
        secret: totpKey,
        encoding: 'base32',
        token: data.code,
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
