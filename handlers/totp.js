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
  requestHelper.getTotpHeaders(event.headers, (error, {apikey = '', apisecret = ''}) => {
    if (error) {
      callback(error);
      return;
    }
    
    requestHelper.getJsonData(event.body, (error, data) => {
      if (error) {
        callback(error);
        return;
      }
      
      totp.create(apikey, apisecret, data, callback);
    });
  });
};

module.exports.validate = (event, context, callback) => {
  totp.validate(event.pathParameters, event.headers, event.body, callback);
};
