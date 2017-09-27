'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
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
    TableName: process.env.TABLE_NAME,
    Item: {
      createdAt: timestamp,
      email: email,
      value: apiKeyValue
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

const getApiKeyByValue = (value, callback) => {
  const params = {
    TableName: process.env.TABLE_NAME,
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
module.exports.getApiKeyByValue = getApiKeyByValue;

const isAlreadyActivated = (apiKeyRecord) => {
  return Boolean(apiKeyRecord && apiKeyRecord.activatedAt);
};
module.exports.isAlreadyActivated = isAlreadyActivated;

const updateApiKeyRecord = (apiKeyRecord, callback) => {
  const params = {
    TableName: process.env.TABLE_NAME,
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
