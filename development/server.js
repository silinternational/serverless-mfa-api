const express = require('express');
const u2fHandlers = require('../handlers/u2f.js');

const app = express();

const mimicApiGateway = (request, response) => {
  return {
    event: {
      headers: request.headers,
      body: request.body,
      pathParameters: request.params,
    },
    callback: (error, data) => {
      if (error) {
        response.status(500).send(error);
      } else {
        response.status(data.statusCode).send(data.body);
      }
    }
  };
};

app.post('/u2f', (request, response) => {
  const {event, callback} = mimicApiGateway(request, response);
  u2fHandlers.createRegistration(event, {}, callback);
});

app.put('/u2f/:uuid', (request, response) => {
  const {event, callback} = mimicApiGateway(request, response);
  u2fHandlers.validateRegistration(event, {}, callback);
});

app.listen(8000, () => {
  console.log('Local development server listening on port 8000')
});
