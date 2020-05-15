'use strict';

const requestHelper = require('../helpers/request-helper.js');
const webauthn = require('../models/webauthn.js');
const response = require('../helpers/response.js');

module.exports.createAuthentication = (event, context, callback) => {
  try {
    const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
    const {userUuid = ''} = event.pathParameters;
    webauthn.createAuthentication(apikey, apisecret, userUuid, callback);
  } catch (e) {
    console.error(e.message);
    response.returnError(500, 'Internal Server Error', callback);
  }
};

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

module.exports.validateRegistration = (event, context, callback) => {
  try {
    const {apikey = '', apisecret = ''} = requestHelper.getMfaHeaders(event.headers);
    const {userUuid = ''} = event.pathParameters;
    const requestData = requestHelper.getJsonData(event.body);
    webauthn.validateRegistration(apikey, apisecret, userUuid, requestData, callback);
  } catch (e) {
    console.error(e.message);
    response.returnError(500, 'Internal Server Error', callback);
  }
};
