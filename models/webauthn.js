'use strict';

const apiKey = require('../models/api-key.js');
const { dynamoDb } = require('../helpers/aws');
const encryption = require('../helpers/encryption.js');
const validator = require('validator');
const response = require('../helpers/response.js');
const {
  parseRegisterRequest,
  generateRegistrationChallenge,
  generateLoginChallenge,
} = require('@webauthn/server');

const createNewWebauthnRecord = (webauthnRecord, callback) => {
  const params = {
    TableName: process.env.WEBAUTHN_TABLE_NAME,
    Item: webauthnRecord,
    ConditionExpression : 'attribute_not_exists(#u)',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    }
  };
  
  dynamoDb.put(params, callback);
};

function recordWebauthnRegistrationChallenge(uuid, apiKeyValue, apiSecret, registration, callback) {
  getWebauthnRecord(uuid, apiKeyValue, (error, webauthnRecord) => {
    if (error) {
      callback(error);
      return;
    }
    
    const encryptedRegistrationChallenge = encryption.encrypt(registration.challenge, apiSecret);
    if (webauthnRecord) {
      webauthnRecord.encryptedRegistrationChallenge = encryptedRegistrationChallenge;
      updateWebauthnRecord(webauthnRecord, callback)
    } else {
      webauthnRecord = {
        'uuid': uuid,
        'apiKey': apiKeyValue,
        'encryptedRegistrationChallenge': encryptedRegistrationChallenge,
      };
      createNewWebauthnRecord(webauthnRecord, callback);
    }
  });
}

module.exports.createAuthentication = (apiKeyValue, apiSecret, userUuid, callback) => {
  console.log('Begin creating WebAuthn authentication');
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, apiKeyError => {
    if (apiKeyError) {
      console.log('Unable to get activated API Key in order to create WebAuthn authentication:', apiKeyError);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    if (! validator.isUUID(userUuid)) {
      console.log('The given User ID must be a UUID when creating a WebAuthn authentication:', userUuid);
      response.returnError(400, 'User ID must be a UUID', callback);
      return;
    }
    
    getWebauthnRecord(userUuid, apiKeyValue, (error, webauthnRecord) => {
      if (error) {
        console.error('Error while getting WebAuthn record for creation an authentication.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }

      if (!webauthnRecord || (webauthnRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such WebAuthn uuid.');
        response.returnError(404, 'No WebAuthn record found with that uuid for that API Key.', callback);
        return;
      }

      const encryptedKeyJSON = webauthnRecord.encryptedKeyJSON;
      if (!encryptedKeyJSON) {
        console.log('No encryptedKeyJSON found on that WebAuthn record.');
        response.returnError(401, 'Unauthorized', callback);
        return;
      }

      encryption.decrypt(encryptedKeyJSON, apiSecret, (error, keyJSON) => {
        if (error) {
          console.error('Error decrypting keyJSON to create WebAuthn authentication:', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }
  
        const key = JSON.parse(keyJSON);
        const loginChallenge = generateLoginChallenge(key);
  
        console.log('Successfully created WebAuthn authentication for User UUID: ' + userUuid);
        response.returnSuccess(loginChallenge, callback);
        return;
      });
    });
  });
};

/**
 * Returns an object defining the options to use when creating a public-key
 * credential in the user's browser.
 *
 * @param apiKeyValue
 * @param apiSecret
 * @param requestData
 * @param callback
 */
module.exports.createRegistration = (apiKeyValue, apiSecret, requestData = {}, callback) => {
  console.log('Begin creating WebAuthn registration');
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, apiKeyError => {
    if (apiKeyError) {
      console.log('Unable to get activated API Key in order to create WebAuthn registration:', apiKeyError);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const userUuid = requestData.user.id;
    if (! validator.isUUID(userUuid)) {
      console.log('The given User ID must be a UUID when creating a WebAuthn registration:', userUuid);
      response.returnError(400, 'User ID must be a UUID', callback);
      return;
    }
    
    try {
      const registration = generateRegistrationChallenge(requestData);
      recordWebauthnRegistrationChallenge(userUuid, apiKeyValue, apiSecret, registration, error => {
        if (error) {
          console.error('Failed to record new WebAuthn registration challenge.', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }
        
        console.log('Successfully created WebAuthn registration for User UUID: ' + userUuid);
        response.returnSuccess(registration, callback);
        return;
      });
    } catch (error) {
      console.error('Error creating WebAuthn registration. Error: ' + error.message);
      if (error.message) {
        response.returnError(400, error.message, callback);
        return;
      } else {
        response.returnError(500, "Unknown error", callback);
        return;
      }
    }
  });
};

module.exports.validateRegistration = (apiKeyValue, apiSecret, userUuid, registrationCredential = {}, callback) => {
  console.log('Begin validating WebAuthn registration');
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, apiKeyError => {
    if (apiKeyError) {
      console.log('Unable to get activated API Key in order to validate WebAuthn registration:', apiKeyError);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    try {
      let {challenge, key} = parseRegisterRequest(registrationCredential);
      if (key === undefined) {
        console.error('Error validating WebAuthn registration. Parsing register request returned no key.');
        response.returnError(400, 'Bad Request', callback);
        return;
      } else {
        getWebauthnRecord(userUuid, apiKeyValue, (error, webauthnRecord) => {
          if (error) {
            console.error('Error while getting WebAuthn record for validating a registration.', error);
            response.returnError(500, 'Internal Server Error', callback);
            return;
          }
          
          if (!webauthnRecord || (webauthnRecord.apiKey !== apiKeyValue)) {
            console.log('API Key has no such WebAuthn uuid.');
            response.returnError(404, 'No WebAuthn record found with that uuid for that API Key.', callback);
            return;
          }
          
          const encryptedRegistrationChallenge = webauthnRecord.encryptedRegistrationChallenge;
          if (!encryptedRegistrationChallenge) {
            console.log('No encryptedRegistrationChallenge found on that WebAuthn record.');
            response.returnError(401, 'Unauthorized', callback);
            return;
          }
          
          encryption.decrypt(encryptedRegistrationChallenge, apiSecret, (error, registrationChallenge) => {
            if (error) {
              console.error('Error decrypting registrationChallenge to validate WebAuthn registration:', error);
              response.returnError(500, 'Internal Server Error', callback);
              return;
            }
            
            if (challenge !== registrationChallenge) {
              console.log('Invalid challenge provided when validating WebAuthn registration.');
              response.returnError(401, 'Unauthorized', callback);
              return;
            }
            
            delete webauthnRecord.encryptedRegistrationChallenge;
            webauthnRecord.encryptedKeyJSON = encryption.encrypt(JSON.stringify(key), apiSecret);
            updateWebauthnRecord(webauthnRecord, (error) => {
              if (error) {
                console.error('Failed to update WebAuthn record after validating registration.', error);
                response.returnError(500, 'Internal Server Error', callback);
                return;
              }
              
              console.log('Successfully validated WebAuthn registration for User UUID: ' + userUuid);
              response.returnSuccess(null, callback);
              return;
            });
          });
        });
      }
    } catch (error) {
      console.error('Error validating WebAuthn registration. Error: ' + error.message);
      if (error.message) {
        response.returnError(400, error.message, callback);
        return;
      } else {
        response.returnError(500, "Unknown error", callback);
        return;
      }
    }
  });
};

const getWebauthnRecord = (uuid, apiKeyValue, callback) => {
  const params = {
    TableName: process.env.WEBAUTHN_TABLE_NAME,
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
      callback(new Error('Failed to retrieve that Webauthn record.'));
      return;
    }
    /* NOTE: Asking for a record that doesn't exist is NOT an error, you simply
     *       get an empty result back.  */
    
    if (result.Item && (result.Item.apiKey !== apiKeyValue)) {
      console.error('AWS ConditionExpression FAILED to limit Webauthn record by apiKey value.');
      callback(new Error('Failed to retrieve the correct Webauthn record.'));
      return;
    }
    
    callback(null, result.Item);
    return;
  });
};

const updateWebauthnRecord = (webauthnRecord, callback) => {
  const params = {
    TableName: process.env.WEBAUTHN_TABLE_NAME,
    Item: webauthnRecord,
    ConditionExpression: 'attribute_exists(#u)',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    }
  };
  
  dynamoDb.put(params, (error) => {
    // Only send our callback the (potential) error, rather than all of the
    // parameters that dynamoDb.put would send.
    callback(error);
  });
};
