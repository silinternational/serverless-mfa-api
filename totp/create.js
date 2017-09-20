'use strict';

const totp = require('../models/totp.js');

module.exports.handler = (event, context, callback) => {
  totp.create(event.headers, callback);
};
