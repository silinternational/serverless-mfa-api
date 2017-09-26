'use strict';

const apiKey = require('../models/api-key.js');
const requestHelper = require('../helpers/request-helper.js');

module.exports.activate = (event, context, callback) => {
  apiKey.activate(event.body, callback);
};

module.exports.create = (event, context, callback) => {
  const {email = ''} = requestHelper.getJsonData(event.body);
  apiKey.create(email, callback);
};
