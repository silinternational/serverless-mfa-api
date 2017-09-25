'use strict';

const apiKey = require('../models/api-key.js');

module.exports.activate = (event, context, callback) => {
  apiKey.activate(event.body, callback);
};

module.exports.create = (event, context, callback) => {
  apiKey.create(event.body, callback);
};
