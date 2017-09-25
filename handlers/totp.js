'use strict';

const totp = require('../models/totp.js');

module.exports.create = (event, context, callback) => {
  totp.create(event.headers, event.body, callback);
};

module.exports.validate = (event, context, callback) => {
  totp.validate(event.pathParameters, event.headers, event.body, callback);
};
