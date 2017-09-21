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
