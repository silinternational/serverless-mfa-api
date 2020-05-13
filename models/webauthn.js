'use strict';

const apiKey = require('../models/api-key.js');
const { dynamoDb } = require('../helpers/aws');
const encryption = require('../helpers/encryption.js');
const response = require('../helpers/response.js');
const uuid = require('uuid');
const {
  parseRegisterRequest,
  generateRegistrationChallenge,
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
  
    try {
      const result = generateRegistrationChallenge(requestData);
    
      /** @todo Save the `challenge` from that, for comparing later. */
    
      response.returnSuccess(result, callback);
      return;
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
  try {
    let { challenge, key } = parseRegisterRequest(registrationCredential);
    if (key === undefined) {
      console.error('Error validating WebAuthn registration. Parsing register request returned no key.');
      response.returnError(400, 'Bad Request', callback);
      return;
    } else {
      const webauthnUuid = uuid.v4();
      const webauthnRecord = {
        'uuid': webauthnUuid,
        'apiKey': apiKeyValue,
        'challenge': challenge,
        'encryptedKeyJSON': encryption.encrypt(JSON.stringify(key), apiSecret),
      };
      createNewWebauthnRecord(webauthnRecord, (error) => {
        if (error) {
          console.error('Failed to create new WebAuthn record.', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }
  
        const apiResponse = {
          'uuid': webauthnUuid
        };
  
        console.log('Successfully created WebAuthn registration for uuid: ' + webauthnUuid);
        response.returnSuccess(apiResponse, callback);
        return;
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
};
