const apiKey = require('../../models/api-key.js');
const assert = require('assert');
const crypto = require('crypto');
const {Given, When, Then} = require('cucumber');
const encryption = require('../../helpers/encryption.js');
const password = require('../../helpers/password.js');

let aesKeyBase64;
let apiKeyRecord;
let apiSecret;
let apiSecret2;
let apiSecretValidationResult;
let decryptedMessage;
let encryptedMessage;
let hashedApiSecret;
let hashedApiSecretCheck;
let plainTextMessage;

Given('I do NOT have an API Key record', function () {
  apiKeyRecord = undefined;
});

Given('I do NOT have an API Secret', function () {
  apiSecret = undefined;
});

Given('I have a 2nd API Secret that is different', function () {
  apiSecret2 = crypto.randomBytes(32).toString('base64');
  assert(apiSecret2 != undefined);
  assert.notEqual(apiSecret2, apiSecret);
});

Given('I have a base64-encoded AES key', function () {
  aesKeyBase64 = crypto.randomBytes(32).toString('base64');
  assert(aesKeyBase64, 'Failed to create base64-encoded AES key');
});

Given('I have a hash of the API Secret', function () {
  hashedApiSecret = password.hash(apiSecret);
});

Given('I have an API Key record', function () {
  apiKeyRecord = {};
});

Given('I have an API Secret', function () {
  apiSecret = crypto.randomBytes(32).toString('base64');
  assert(apiSecret != undefined);
});

Given('I have encrypted a plain text message', function () {
  plainTextMessage = 'A plain text message';
  encryptedMessage = encryption.encrypt(plainTextMessage, aesKeyBase64);
});

Given('the API Key record does NOT have a hashed API Secret', function () {
  delete apiKeyRecord.hashedApiSecret;
});

Given(/the API Key record has a hash of some (?:other|unknown) API Secret/, function () {
  assert.notEqual(apiKeyRecord, undefined);
  apiKeyRecord.hashedApiSecret = password.hash(
    crypto.randomBytes(32).toString('base64')
  );
});

Given('the API Key record has a hash of the API Secret', function () {
  assert.notEqual(apiKeyRecord, undefined);
  apiKeyRecord.hashedApiSecret = password.hash(apiSecret);
});

When('I check the API Secret against the hashed API Secret', function () {
  hashedApiSecretCheck = password.compare(apiSecret, hashedApiSecret);
});

When('I check the 2nd API Secret against the hashed API Secret', function () {
  hashedApiSecretCheck = password.compare(apiSecret2, hashedApiSecret);
});

When('I create a hash of the API Secret', function () {
  hashedApiSecret = password.hash(apiSecret);
});

When('I decrypt the encrypted message', function (callback) {
  encryption.decrypt(encryptedMessage, aesKeyBase64, (error, decryptionResult) => {
    decryptedMessage = decryptionResult;
    callback();
  });
});

When('I decrypt the encrypted message using a wrong AES key', function (callback) {
  const wrongAesKeyBase64 = crypto.randomBytes(32).toString('base64');
  encryption.decrypt(encryptedMessage, wrongAesKeyBase64, (error, decryptionResult) => {
    decryptedMessage = decryptionResult;
    callback();
  });
});

When('I encrypt a plain text message', function () {
  plainTextMessage = 'The test message';
  encryptedMessage = encryption.encrypt(plainTextMessage, aesKeyBase64);
});

When('I validate my API Secret against the API Key record', function () {
  apiSecretValidationResult = apiKey.isValidApiSecret(apiKeyRecord, apiSecret);
});

Then('the API Secret should come back as NOT valid', function () {
  assert.strictEqual(apiSecretValidationResult, false);
});

Then('the API Secret should come back as valid', function () {
  assert.strictEqual(apiSecretValidationResult, true);
});

Then('the decrypted message should match the plain text message', function () {
  assert.strictEqual(decryptedMessage, plainTextMessage);
});

Then('the decrypted message should NOT match the plain text message', function () {
  assert.notEqual(decryptedMessage, plainTextMessage);
});

Then('the encrypted message should NOT be empty', function () {
  assert(encryptedMessage != undefined);
});

Then('the encrypted message should NOT match the plain text message', function () {
  assert.notEqual(encryptedMessage, plainTextMessage);
});

Then('the hashed API Secret check should have passed', function () {
  assert.strictEqual(hashedApiSecretCheck, true);
});

Then('the hashed API Secret check should have FAILED', function () {
  assert.strictEqual(hashedApiSecretCheck, false);
});

Then('the hashed API Secret should NOT be empty', function () {
  assert(hashedApiSecret != undefined);
});

Then('the hashed API Secret should NOT match the API Secret', function () {
  assert.notEqual(hashedApiSecret, apiSecret);
});
