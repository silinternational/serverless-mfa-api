'use strict';

const apiKey = require('../models/api-key.js');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});
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
    
    const otpSecrets = speakeasy.generateSecret({length: 10});
    let otpAuthUrlOptions = {
      'label': encodeURIComponent(label),
      'secret': otpSecrets.base32,
      'encoding': 'base32'
    };
    if (issuer) {
      otpAuthUrlOptions.issuer = issuer;
      
      // Note: The issuer and account-name used in the `label` need to be
      // URL-encoded. Presumably speakeasy doesn't automatically do so because
      // the colon (:) separating them needs to NOT be encoded.
      otpAuthUrlOptions.label = encodeURIComponent(issuer) + ':' + encodeURIComponent(label);
    }
    
    const otpAuthUrl = speakeasy.otpauthURL(otpAuthUrlOptions);
    qrCode.toDataURL(otpAuthUrl, function(error, dataUrl) {
      if (error) {
        console.error('Failed to generate QR code.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      const totpUuid = uuid.v4();
      const totpKey = otpSecrets.base32;
      const totpRecord = {
        'uuid': totpUuid,
        'apiKey': apiKeyValue,
        'encryptedTotpKey': encryption.encrypt(totpKey, apiSecret)
      };
      
      createNewTotpRecord(totpRecord, (error) => {
        if (error) {
          console.error('Failed to create new TOTP record.', error);
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

const createNewTotpRecord = (totpRecord, callback) => {
  const params = {
    TableName: process.env.TOTP_TABLE_NAME,
    Item: totpRecord,
    ConditionExpression: 'attribute_not_exists(#u)',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    }
  };
  
  dynamoDb.put(params, callback);
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
    
    getTotpRecord(totpUuid, apiKeyValue, (error, totpRecord) => {
      if (error) {
        console.error('Error while getting TOTP to be deleted.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!totpRecord || (totpRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such TOTP uuid.');
        response.returnError(404, 'No TOTP entry found with that uuid for that API Key.', callback);
        return;
      }
      
      deleteTotpRecord(totpRecord, (error) => {
        if (error) {
          console.error('Error while deleting TOTP record.', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }
        
        response.returnSuccess(null, callback);
        return;
      });
    });
  });
};

const deleteTotpRecord = (totpRecord, callback) => {
  const params = {
    TableName: process.env.TOTP_TABLE_NAME,
    Key: {
      'uuid': totpRecord.uuid
    },
    ConditionExpression: 'attribute_exists(#u) AND apiKey = :apiKey',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    },
    ExpressionAttributeValues: {
      ':apiKey': totpRecord.apiKey
    }
  };
  
  dynamoDb.delete(params, callback);
};

const getTotpRecord = (uuid, apiKeyValue, callback) => {
  const params = {
    TableName: process.env.TOTP_TABLE_NAME,
    Key: {
      'uuid': uuid
    },
    ConditionExpression: 'apiKey = :apiKey',
    ExpressionAttributeValues: {
      ':apiKey': apiKeyValue
    }
  };
  
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Failed to retrieve that TOTP record.'));
      return;
    }
    /* NOTE: Asking for a record that doesn't exist is NOT an error, you simply
     *       get an empty result back.  */
    
    if (result.Item && (result.Item.apiKey !== apiKeyValue)) {
      console.error('AWS ConditionExpression FAILED to limit TOTP record by apiKey value.');
      callback(new Error('Failed to retrieve the correct TOTP record.'));
      return;
    }
    
    callback(null, result.Item);
    return;
  });
};

module.exports.validate = (apiKeyValue, apiSecret, totpUuid, code, callback) => {
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to validate TOTP:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!totpUuid) {
      console.log('TOTP validate request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (!code) {
      response.returnError(400, 'code (as a string) is required', callback);
      return;
    }
    
    getTotpRecord(totpUuid, apiKeyValue, (error, totpRecord) => {
      if (error) {
        console.error('Error while getting TOTP record for validating a code.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!totpRecord || (totpRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such TOTP uuid.');
        response.returnError(401, 'Unauthorized', callback);
        return;
      }
      
      const encryptedTotpKey = totpRecord.encryptedTotpKey;
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
  });
};
