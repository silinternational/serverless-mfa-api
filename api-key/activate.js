'use strict';

const apiKey = require('../models/api-key.js');

module.exports.handler = (event, context, callback) => {
  apiKey.activate(event.body, callback);
};
