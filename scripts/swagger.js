const express = require('express');
const swaggerAutogen = require('swagger-autogen')();
const { serve, setup } = require('swagger-ui-express');

const outputFile = './dist/swagger-output.json';
const endpointsFiles = ['./src/app/routes/health.router-factory.ts','./src/app/routes/queue.router-factory.ts'];

const app = express();

swaggerAutogen(outputFile, endpointsFiles, { host: 'localhost:8080' }).then(({ data }) => {
  app.use('/', serve, setup(data));
});

app.listen(80);
