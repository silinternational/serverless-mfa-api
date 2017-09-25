const crypto = require('crypto');

module.exports.encrypt = (plainTextMessage, aesKeyBase64) => {
  const aesKeyBuffer = Buffer.from(aesKeyBase64, 'base64');
  const ivBuffer = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-ctr', aesKeyBuffer, ivBuffer);
  let encrypted = cipher.update(plainTextMessage, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return ivBuffer.toString('base64') + ':' + encrypted;
};

module.exports.decrypt = (ivAndEncryptedDataBase64, aesKeyBase64, callback) => {
  const inputPieces = ivAndEncryptedDataBase64.split(':');
  if (inputPieces.length !== 2) {
    console.error(
      'Expected a single colon (:) delimiter, between the IV and the ' +
      'encrypted data. Found %s.',
      inputPieces.length
    );
    callback(new Error('Unable to decrypt the given data.'));
    return;
  }
  
  const ivBuffer = Buffer.from(inputPieces[0], 'base64');
  const encryptedDataBase64 = inputPieces[1];
  const aesKeyBuffer = Buffer.from(aesKeyBase64, 'base64');
  if (aesKeyBuffer.length !== 32) {
    console.error(
      'The encryption key must be 256 bits (32 Bytes). Found %s Bytes.',
      aesKeyBuffer.length
    );
    callback(new Error('That is not a valid encryption key.'));
    return;
  }
  
  const decipher = crypto.createDecipheriv('aes-256-ctr', aesKeyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedDataBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  callback(null, decrypted);
  return;
};
