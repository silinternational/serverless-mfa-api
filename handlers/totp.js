'use strict';

const requestHelper = require('../helpers/request-helper.js');
const totp = require('../models/totp.js');

module.exports.create = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const options = requestHelper.getJsonData(event.body);
  totp.create(apikey, apisecret, options, callback);
};

module.exports.delete = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  totp.delete(apikey, apisecret, uuid, callback);
};

module.exports.validate = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  const {code = ''} = requestHelper.getJsonData(event.body);
  totp.validate(apikey, apisecret, uuid, code, callback);
};
