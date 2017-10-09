'use strict';

const requestHelper = require('../helpers/request-helper.js');
const u2f = require('../models/u2f.js');

module.exports.createAuthentication = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  u2f.createAuthentication(apikey, apisecret, uuid, callback);
};

module.exports.createRegistration = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const options = requestHelper.getJsonData(event.body);
  u2f.createRegistration(apikey, apisecret, options, callback);
};

module.exports.delete = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  u2f.delete(apikey, apisecret, uuid, callback);
};

module.exports.validateAuthentication = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  const options = requestHelper.getJsonData(event.body);
  u2f.validateAuthentication(apikey, apisecret, uuid, options, callback);
};

module.exports.validateRegistration = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  const options = requestHelper.getJsonData(event.body);
  u2f.validateRegistration(apikey, apisecret, uuid, options, callback);
};
