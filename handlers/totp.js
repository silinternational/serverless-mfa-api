'use strict';

const totp = require('../models/totp.js');

module.exports.create = (event, context, callback) => {
  totp.create(event.headers, callback);
};
