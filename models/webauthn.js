'use strict';

const apiKey = require('../models/api-key.js');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});
const encryption = require('../helpers/encryption.js');
const response = require('../helpers/response.js');
const uuid = require('uuid');

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

module.exports.createAttestation = (apiKeyValue, apiSecret, options = {}, callback) => {
  console.log('Begin creating WebAuthn attestation');
  
  console.log('options', options); // TEMP
};
