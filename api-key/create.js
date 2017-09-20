'use strict';

const apiKey = require('../models/api-key.js');

module.exports.handler = (event, context, callback) => {
  apiKey.create(event.body, callback);
};
