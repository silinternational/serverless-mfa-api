'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const response = require ('../helpers/response.js');

module.exports.activate = (requestBody, callback) => {
  const data = JSON.parse(requestBody);
  
  if ((!data.email) || typeof data.email !== 'string') {
    response.returnError(400, 'email is required', callback);
    return;
  }
  
  if ((!data.apiKey) || typeof data.apiKey !== 'string') {
    response.returnError(400, 'apiKey is required', callback);
    return;
  }
  
  getApiKeyByValue(data.apiKey, (error, apiKeyRecord) => {
    if (error) {
      console.error(error);
      response.returnError(500, 'Failed to retrieve API Key.', callback);
      return;
    }
    
    const noSuchApiKeyRecord = (apiKeyRecord == undefined);
    if (noSuchApiKeyRecord || (apiKeyRecord.email !== data.email)) {
      response.returnError(404, 'No matching API Key record was found', callback);
      return;
    }
    
    if (isAlreadyActivated(apiKeyRecord)) {
      console.log(
        'Attempt to re-activate API Key %s...',
        data.apiKey.substr(0, data.apiKey.length / 2)
      );
      response.returnError(401, 'Unauthorized', callback);
      return;
    }
    
    const apiSecret = crypto.randomBytes(32).toString('base64');
    apiKeyRecord.apiSecret = apiSecret;
    updateApiKeyRecord(apiKeyRecord, (error) => {
      if (error) {
        console.error(error);
        response.returnError(500, 'Error while activating API Key.', callback);
        return;
      }
      
      response.returnSuccess({'apiSecret': apiSecret}, callback);
      return;
    });
  });
};

module.exports.create = (requestBody, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(requestBody);
  
  if ((!data.email) || typeof data.email !== 'string') {
    response.returnError(400, 'email is required', callback);
    return;
  }
  
  /* @todo Validate that it seems to be an actual email address. */
  
  const apiKeyValue = crypto.randomBytes(20).toString('hex');
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      createdAt: timestamp,
      email: data.email,
      value: apiKeyValue
    }
  };
  
  dynamoDb.put(params, (error, result) => {
    if (error) {
      console.error(error);
      response.returnError(500, 'Failed to save new API Key.', callback);
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

const isAlreadyActivated = (apiKeyRecord) => {
  return Boolean(apiKeyRecord && apiKeyRecord.apiSecret);
};

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
