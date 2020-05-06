'use strict';

const requestHelper = require('../helpers/request-helper.js');
const webauthn = require('../models/webauthn.js');
const response = require('../helpers/response.js');

module.exports.createRegistration = (event, context, callback) => {
  try {
    const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
    const requestData = requestHelper.getJsonData(event.body);
    webauthn.createRegistration(apikey, apisecret, requestData, callback);
  } catch (e) {
    console.error(e.message);
    response.returnError(500, 'Internal Server Error', callback);
  }
};
