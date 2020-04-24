require('dotenv').config({ path: 'development/development.env' });

const express = require('express');
const bodyParser = require('body-parser');

const apiKeyHandlers = require('../handlers/api-key.js');
const totpHandlers = require('../handlers/totp.js');
const u2fHandlers = require('../handlers/u2f.js');

const app = express();
const mapTo = requestHandler => (request, response) => {
  const {event, callback} = mimicApiGateway(request, response);
  requestHandler(event, {}, callback);
};
const mimicApiGateway = (request, response) => {
  return {
    event: createEventFrom(request),
    callback: createCallbackUsing(response),
  };
};
const createEventFrom = request => {
  return {
    headers: request.headers,
    body: request.body,
    pathParameters: request.params,
  }
};
const createCallbackUsing = response => (error, data) => {
  if (error) {
    response.status(500).send(error);
  } else {
    response.status(data.statusCode).send(data.body);
  }
};

// Parse the request body and always return as a text string.
app.use(bodyParser.text({type: () => true}));

// @todo - Figure out how best to handle these "private" API endpoints.
app.post('/api-key', mapTo(apiKeyHandlers.create));
app.post('/api-key/activate', mapTo(apiKeyHandlers.activate));

app.post('/totp', mapTo(totpHandlers.create));
app.delete('/totp/:uuid', mapTo(totpHandlers.delete));
app.post('/totp/:uuid/validate', mapTo(totpHandlers.validate));

app.post('/u2f', mapTo(u2fHandlers.createRegistration));
app.delete('/u2f/:uuid', mapTo(u2fHandlers.delete));
app.put('/u2f/:uuid', mapTo(u2fHandlers.validateRegistration));
app.post('/u2f/:uuid/auth', mapTo(u2fHandlers.createAuthentication));
app.put('/u2f/:uuid/auth', mapTo(u2fHandlers.validateAuthentication));

app.listen(8080, () => {
  console.log('Local development server listening on port 8080')
});
