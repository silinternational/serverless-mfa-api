const express = require('express');
const u2fHandlers = require('../handlers/u2f.js');

const app = express();

app.post('/u2f', ({headers, body}, response) => {
  u2fHandlers.createRegistration({headers, body}, {}, (error, data) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(data.statusCode).send(data.body);
    }
  })
});

app.listen(8000, () => {
  console.log('Local development server listening on port 8000')
});
