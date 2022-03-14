'use strict';

const apiKey = require('../models/api-key.js');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});
const encryption = require('../helpers/encryption.js');
const response = require('../helpers/response.js');
const u2f = require('u2f');
const uuid = require('uuid');

module.exports.createAuthentication = (apiKeyValue, apiSecret, u2fUuid, callback) => {
  console.log('Starting create U2F authentication for uuid: ' + u2fUuid);
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to create U2F:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    if (!u2fUuid) {
      console.log('U2F create authentication request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    getU2fRecord(u2fUuid, apiKeyValue, (error, u2fRecord) => {
      if (error) {
        console.error('Error while getting U2F record when creating U2F authentication.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!u2fRecord || (u2fRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such U2F uuid.');
        response.returnError(404, 'No U2F record found with that uuid for that API Key.', callback);
        return;
      }
      
      const encryptedAppId = u2fRecord.encryptedAppId;
      if (!encryptedAppId) {
        console.error('No encryptedAppId found in that U2F record.');
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }

      encryption.decrypt(encryptedAppId, apiSecret, (error, appId) => {
        if (error) {
          console.error('Error validating AppId', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        const encryptedKeyHandle = u2fRecord.encryptedKeyHandle;
        if (!encryptedKeyHandle) {
          console.error('No encryptedKeyHandle found in that U2F record.');
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        encryption.decrypt(encryptedKeyHandle, apiSecret, (error, keyHandle) => {
          if (error) {
            console.error('Error validating KeyHandle', error);
            response.returnError(500, 'Internal Server Error', callback);
            return;
          }

          const authRequest = u2f.request(appId, keyHandle);

          u2fRecord.encryptedAuthenticationRequest = encryption.encrypt(JSON.stringify(authRequest), apiSecret);
          updateU2fRecord(u2fRecord, (error) => {
            if (error) {
              console.error('Failed to save new U2F authentication request.', error);
              response.returnError(500, 'Internal Server Error', callback);
              return;
            }

            const apiResponse = {
              'uuid': u2fUuid,
              'version': authRequest.version,
              'challenge': authRequest.challenge,
              'appId': appId,
              'keyHandle': keyHandle
            };

            console.log("Successfully created U2F authentication for uuid: " + u2fUuid);
            response.returnSuccess(apiResponse, callback);
            return;
          });
        });
      });
    });
  });
};

const createNewU2fRecord = (u2fRecord, callback) => {
  const params = {
    TableName: process.env.U2F_TABLE_NAME,
    Item: u2fRecord,
    ConditionExpression : 'attribute_not_exists(#u)',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    }
  };
  
  dynamoDb.put(params, callback);
};

module.exports.createRegistration = (apiKeyValue, apiSecret, {appId} = {}, callback) => {
  console.log('Begin creating U2F registration');
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to create U2F:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    if ((!appId) || typeof appId !== 'string') {
      response.returnError(400, 'appId is required', callback);
      return;
    }

    const registrationRequest = u2f.request(appId);

    const u2fUuid = uuid.v4();
    const u2fRecord = {
      'uuid': u2fUuid,
      'apiKey': apiKeyValue,
      'encryptedAppId': encryption.encrypt(appId, apiSecret),
      'encryptedRegistrationRequest': encryption.encrypt(JSON.stringify(registrationRequest), apiSecret)
    };
    createNewU2fRecord(u2fRecord, (error) => {
      if (error) {
        console.error('Failed to create new U2F record.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }

      const apiResponse = {
        'uuid': u2fUuid,
        'challenge': registrationRequest
      };

      console.log('Successfully created U2F registration for uuid: ' + u2fUuid);
      response.returnSuccess(apiResponse, callback);
      return;
    });
  });
};

module.exports.delete = (apiKeyValue, apiSecret, u2fUuid, callback) => {
  console.log('Begin deleting U2F for uuid: ' + u2fUuid);
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to delete U2F record:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    if (!u2fUuid) {
      console.log('U2F delete request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    getU2fRecord(u2fUuid, apiKeyValue, (error, u2fRecord) => {
      if (error) {
        console.error('Error while getting U2F record in order to delete it:', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!u2fRecord || (u2fRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such U2F uuid.');
        response.returnError(404, 'No U2F record found with that uuid for that API Key.', callback);
        return;
      }
      
      deleteU2fRecord(u2fRecord, (error) => {
        if (error) {
          console.error('Error while deleting U2F record:', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        console.log('Successfully deleted U2F for uuid: ' + u2fUuid);
        response.returnSuccess(null, callback);
        return;
      });
    });
  });
};

const deleteU2fRecord = (u2fRecord, callback) => {
  const params = {
    TableName: process.env.U2F_TABLE_NAME,
    Key: {
      'uuid': u2fRecord.uuid
    },
    ConditionExpression: 'attribute_exists(#u) AND apiKey = :apiKey',
    ExpressionAttributeNames: {
      '#u': 'uuid'
    },
    ExpressionAttributeValues: {
      ':apiKey': u2fRecord.apiKey
    }
  };
  
  dynamoDb.delete(params, (error) => {
    // Only send our callback the (potential) error, rather than all of the
    // parameters that dynamoDb.delete would send.
    callback(error);
  });
};

const getU2fRecord = (uuid, apiKeyValue, callback) => {
  const params = {
    TableName: process.env.U2F_TABLE_NAME,
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
      callback(new Error('Failed to retrieve that U2F record.'));
      return;
    }
    /* NOTE: Asking for a record that doesn't exist is NOT an error, you simply
     *       get an empty result back.  */
    
    if (result.Item && (result.Item.apiKey !== apiKeyValue)) {
      console.error('AWS ConditionExpression FAILED to limit U2F record by apiKey value.');
      callback(new Error('Failed to retrieve the correct U2F record.'));
      return;
    }
    
    callback(null, result.Item);
    return;
  });
};

const updateU2fRecord = (u2fRecord, callback) => {
  const params = {
    TableName: process.env.U2F_TABLE_NAME,
    Item: u2fRecord,
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

module.exports.validateAuthentication = (apiKeyValue, apiSecret, u2fUuid, {signResult} = {}, callback) => {
  console.log('Begin validating authentication for uuid: ' + u2fUuid);
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to validate U2F authentication:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    if (!u2fUuid) {
      console.log('U2F validate authentication request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    getU2fRecord(u2fUuid, apiKeyValue, (error, u2fRecord) => {
      if (error) {
        console.error('Error while getting U2F record to validate U2F authentication:', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!u2fRecord || (u2fRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such U2F uuid.');
        response.returnError(404, 'No U2F record found with that uuid for that API Key.', callback);
        return;
      }
      
      const encryptedAuthenticationRequest = u2fRecord.encryptedAuthenticationRequest;
      if (!encryptedAuthenticationRequest) {
        console.error('No encryptedAuthenticationRequest found in that U2F record.');
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }

      encryption.decrypt(encryptedAuthenticationRequest, apiSecret, (error, authenticationRequest) => {
        if (error) {
          console.error('Error decrypting authenticationRequest to validate U2F authentication:', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        const encryptedPublicKey = u2fRecord.encryptedPublicKey;
        if (!encryptedPublicKey) {
          console.error('No encryptedPublicKey found in that U2F record.');
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        encryption.decrypt(encryptedPublicKey, apiSecret, (error, publicKey) => {
          const result = u2f.checkSignature(JSON.parse(authenticationRequest), signResult, publicKey);
          if (result.errorMessage) {
            console.error('Error validating U2F authentication. Error: ' + result.errorMessage);
            response.returnError(400, result.errorMessage, callback);
            return;
          }

          delete u2fRecord.encryptedAuthenticationRequest;
          updateU2fRecord(u2fRecord, (error) => {
            if (error) {
              console.error('Unable to unset encryptedAuthenticationRequest after successful authentication');
              response.returnError(500, 'Internal Server Error', callback);
              return;
            }

            console.log('Successfully validated U2F authentication for uuid: ' + u2fUuid);
            response.returnSuccess({'message': 'Valid', 'status': 200}, callback);
            return;
          });
        });
      });
    });
  });
};

module.exports.validateRegistration = (apiKeyValue, apiSecret, u2fUuid, {signResult} = {}, callback) => {
  console.log('Begin validating registration for uuid: ' + u2fUuid);
  apiKey.getActivatedApiKey(apiKeyValue, apiSecret, (error, apiKeyRecord) => {
    if (error) {
      console.log('Unable to get activated API Key in order to validate U2F registration:', error);
      response.returnError(401, 'Unauthorized', callback);
      return;
    }

    if (!u2fUuid) {
      console.log('U2F validate registration request had no UUID.');
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    getU2fRecord(u2fUuid, apiKeyValue, (error, u2fRecord) => {
      if (error) {
        console.error('Error while getting U2F record for validating a registration.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      if (!u2fRecord || (u2fRecord.apiKey !== apiKeyValue)) {
        console.log('API Key has no such U2F uuid.');
        response.returnError(404, 'No U2F record found with that uuid for that API Key.', callback);
        return;
      }
      
      const encryptedRegistrationRequest = u2fRecord.encryptedRegistrationRequest;
      if (!encryptedRegistrationRequest) {
        console.error('No encryptedRegistrationRequest found in that U2F record.');
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }

      encryption.decrypt(encryptedRegistrationRequest, apiSecret, (error, registrationRequest) => {
        if (error) {
          console.error('Error decrypting registrationRequest', error);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        const result = u2f.checkRegistration(JSON.parse(registrationRequest), signResult);
        if (result.errorMessage) {
          console.error('U2F check registration failed. Error: ' + result.errorMessage);
          response.returnError(500, 'Internal Server Error', callback);
          return;
        }

        delete u2fRecord.encryptedRegistrationRequest;
        u2fRecord.encryptedPublicKey = encryption.encrypt(result.publicKey, apiSecret);
        u2fRecord.encryptedKeyHandle = encryption.encrypt(result.keyHandle, apiSecret);

        updateU2fRecord(u2fRecord, (error) => {
          if (error) {
            console.error('Error while updating U2F record after validating registration', error);
            response.returnError(500, 'Internal Server Error', callback);
            return;
          }

          console.log('Successfully validated U2F registration for uuid: ' + u2fUuid);
          response.returnSuccess(null, callback);
          return;
        });
      });
    });
  });
};
