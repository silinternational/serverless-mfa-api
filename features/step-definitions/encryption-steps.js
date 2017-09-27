const assert = require('assert');
const crypto = require('crypto');
const {defineSupportCode} = require('cucumber');
const encryption = require('../../helpers/encryption.js');

defineSupportCode(function({Given, When, Then}) {
  let aesKeyBase64;
  let encryptedMessage;
  let plainTextMessage;
  
  /** @var result The result of a When step. */
  let result;
  
  Given('I have a base64-encoded AES key', function () {
    aesKeyBase64 = crypto.randomBytes(32).toString('base64');
    assert(aesKeyBase64, 'Failed to create base64-encoded AES key');
  });
  
  Given('I have encrypted a plain text message', function () {
    plainTextMessage = 'A plain text message';
    encryptedMessage = encryption.encrypt(plainTextMessage, aesKeyBase64);
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
