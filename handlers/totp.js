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
  let {apikey = '', apisecret = ''} = requestHelper.getTotpHeaders(event.headers);
  let options = requestHelper.getJsonData(event.body);
  totp.create(apikey, apisecret, options, callback);
};

module.exports.validate = (event, context, callback) => {
  totp.validate(event.pathParameters, event.headers, event.body, callback);
};
