const express = require('express');
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

// Define URL mapping.
app.post('/u2f', mapTo(u2fHandlers.createRegistration));
app.put('/u2f/:uuid', mapTo(u2fHandlers.validateRegistration));

app.listen(8000, () => {
  console.log('Local development server listening on port 8000')
});
