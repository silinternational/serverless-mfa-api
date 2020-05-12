
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT
});

module.exports.dynamoDb = dynamoDb;
