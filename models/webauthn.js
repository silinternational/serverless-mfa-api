'use strict';

const apiKey = require('../models/api-key.js');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});
const encryption = require('../helpers/encryption.js');
const response = require('../helpers/response.js');
const uuid = require('uuid');
const {
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
  
  try {
    const result = generateRegistrationChallenge(requestData);
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
};
