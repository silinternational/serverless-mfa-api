'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});
const password = require('../helpers/password.js');
const response = require ('../helpers/response.js');

module.exports.activate = (apiKeyValue, email, callback) => {
  
  if ((!email) || typeof email !== 'string') {
    response.returnError(400, 'email is required', callback);
    return;
  }
  
  if ((!apiKeyValue) || typeof apiKeyValue !== 'string') {
    response.returnError(400, 'apiKey is required', callback);
    return;
  }
  
  getApiKeyByValue(apiKeyValue, (error, apiKeyRecord) => {
    if (error) {
      console.error('Failed to retrieve API Key.', error);
      response.returnError(500, 'Internal Server Error', callback);
      return;
    }
    
    const noSuchApiKeyRecord = (apiKeyRecord == undefined);
    if (noSuchApiKeyRecord || (apiKeyRecord.email !== email)) {
      response.returnError(404, 'No matching API Key record was found', callback);
      return;
    }
    
    if (isAlreadyActivated(apiKeyRecord)) {
      console.log(
        'Attempt to re-activate API Key %s...',
        apiKeyValue.substr(0, apiKeyValue.length / 2)
      );
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const apiSecret = crypto.randomBytes(32).toString('base64');
    apiKeyRecord.activatedAt = new Date().getTime();
    apiKeyRecord.hashedApiSecret = password.hash(apiSecret);
    updateApiKeyRecord(apiKeyRecord, (error) => {
      if (error) {
        console.error('Error while activating API Key.', error);
        response.returnError(500, 'Internal Server Error', callback);
        return;
      }
      
      response.returnSuccess({'apiSecret': apiSecret}, callback);
      return;
    });
  });
};

module.exports.create = (email, callback) => {
  const timestamp = new Date().getTime();
  
  if ((!email) || typeof email !== 'string') {
    response.returnError(400, 'email is required', callback);
    return;
  }
  
  /* @todo Validate that it seems to be an actual email address. */
  
  const apiKeyValue = crypto.randomBytes(20).toString('hex');
  const params = {
    TableName: process.env.API_KEY_TABLE_NAME,
    Item: {
      createdAt: timestamp,
      email: email,
      value: apiKeyValue
    },
    ConditionExpression : 'attribute_not_exists(#v)',
    ExpressionAttributeNames: {
      '#v': 'value'
    }
  };
  
  dynamoDb.put(params, (error, result) => {
    if (error) {
      console.error('Failed to save new API Key.', error);
      response.returnError(500, 'Internal Server Error', callback);
      return;
    }
    
    response.returnSuccess(null, callback);
    return;
  });
};

/**
 * Get the API Key that...
 * - matches the given API Key value,
 * - matches the given API Secret, and
 * - has been activated.
 *
 * If such an API Key is found, it will be given to the callback. Otherwise, an
 * Error will be given to the callback.
 */
module.exports.getActivatedApiKey = (apiKeyValue, apiSecret, callback) => {
  if (!apiKeyValue) {
    callback(new Error('No API Key value provided.'));
    return;
  }
  
  if (!apiSecret) {
    callback(new Error('No API Secret provided.'));
    return;
  }
  
  getApiKeyByValue(apiKeyValue, (error, apiKeyRecord) => {
    if (error) {
      console.error(error);
      callback(new Error('Failed to retrieve API Key by value.'));
      return;
    }
    
    /* NOTE: Check the API Secret before seeing if the API Key is activated so
     *       that all requests with an API Key value and API Secret have the
     *       time delay of dealing with a hashed API Secret.  */
    if (!isValidApiSecret(apiKeyRecord, apiSecret)) {
      callback(new Error('Invalid API Secret.'));
      return;
    }
    
    if (!isAlreadyActivated(apiKeyRecord)) {
      callback(new Error('API Key has not yet been activated.'));
      return;
    }
    
    callback(null, apiKeyRecord);
    return;
  });
};

const getApiKeyByValue = (value, callback) => {
  const params = {
    TableName: process.env.API_KEY_TABLE_NAME,
    Key: {
      value: value
    }
  };
  
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Failed to retrieve that API Key.'));
      return;
    }
    /* NOTE: Asking for a record that doesn't exist is NOT an error, you simply
     *       get an empty result back.  */
    
    callback(null, result.Item);
    return;
  });
};

const isAlreadyActivated = (apiKeyRecord) => {
  return Boolean(apiKeyRecord && apiKeyRecord.activatedAt);
};
module.exports.isAlreadyActivated = isAlreadyActivated;

const isValidApiSecret = (apiKeyRecord, apiSecret = '') => {
  if (!apiKeyRecord) {
    console.log('No API Key record provided, so API Secret is NOT valid.');
    password.pretendToCompare();
    return false;
  }
  
  if (!apiKeyRecord.hashedApiSecret) {
    console.log('The given API Key record has no hashed API Secret');
    password.pretendToCompare();
    return false;
  }
  
  const isValid = password.compare(apiSecret, apiKeyRecord.hashedApiSecret);
  if (isValid !== true) {
    console.log('The given API Secret is NOT valid for the given API Key record.');
    const redactedApiSecret = apiSecret.substring(0, 3) + '...[snip]...' + apiSecret.substring(apiSecret.length - 3);
    console.log(redactedApiSecret);
    return false;
  }
  
  return true;
};
module.exports.isValidApiSecret = isValidApiSecret;

const updateApiKeyRecord = (apiKeyRecord, callback) => {
  const params = {
    TableName: process.env.API_KEY_TABLE_NAME,
    Item: apiKeyRecord
  };
  
  dynamoDb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(new Error('Failed to update API Key record.'));
      return;
    }
    
    callback(null);
    return;
  });
};
module.exports.updateApiKeyRecord = updateApiKeyRecord;
