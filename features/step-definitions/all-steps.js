const assert = require('assert');
const crypto = require('crypto');
const {defineSupportCode} = require('cucumber');
const encryption = require('../../helpers/encryption.js');
const password = require('../../helpers/password.js');

defineSupportCode(function({Given, When, Then}) {
  let aesKeyBase64;
  let apiSecret;
  let apiSecret2;
  let encryptedMessage;
  let hashedApiSecret;
  let hashedApiSecretCheck;
  let plainTextMessage;
  
  /** @var result The result of the single When step called in a scenario. */
  let result;
  
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
  
  Given('I have an API Secret', function () {
    apiSecret = crypto.randomBytes(32).toString('base64');
    assert(apiSecret != undefined);
  });
  
  Given('I have encrypted a plain text message', function () {
    plainTextMessage = 'A plain text message';
    encryptedMessage = encryption.encrypt(plainTextMessage, aesKeyBase64);
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
    encryption.decrypt(encryptedMessage, aesKeyBase64, (error, decryptedMessage) => {
      result = decryptedMessage;
      callback();
    });
  });
  
  When('I decrypt the encrypted message using a wrong AES key', function (callback) {
    const wrongAesKeyBase64 = crypto.randomBytes(32).toString('base64');
    encryption.decrypt(encryptedMessage, wrongAesKeyBase64, (error, decryptedMessage) => {
      result = decryptedMessage;
      callback();
    });
  });
  
  When('I encrypt a plain text message', function () {
    plainTextMessage = 'The test message';
    result = encryption.encrypt(plainTextMessage, aesKeyBase64);
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
  
  Then('the result should match the plain text message', function () {
    assert.strictEqual(result, plainTextMessage);
  });

  Then('the result should NOT be empty', function () {
    assert(result != undefined, 'The result seemed empty');
  });
  
  Then('the result should NOT match the plain text message', function () {
    assert.notEqual(result, plainTextMessage);
  });
});
