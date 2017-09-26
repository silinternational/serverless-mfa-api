'use strict';

const requestHelper = require('../helpers/request-helper.js');
const totp = require('../models/totp.js');

/*
 * NOTE: These handlers assume that any errors passed to their callbacks will
 *       be intended for the API caller. Any error messages with potentially
 *       sensitive data should be handled elsewhere, and only safe error
 *       messages should be passed to callbacks.
 */
 
module.exports.create = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getTotpHeaders(event.headers);
  const options = requestHelper.getJsonData(event.body || undefined);
  totp.create(apikey, apisecret, options, callback);
};

module.exports.validate = (event, context, callback) => {
  const {apikey = '', apisecret = ''} = requestHelper.getTotpHeaders(event.headers);
  const {uuid = ''} = event.pathParameters;
  const {code = ''} = requestHelper.getJsonData(event.body);
  totp.validate(apikey, apisecret, uuid, code, callback);
};
