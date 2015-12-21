'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');

const server = new Hapi.Server();

const swaggerOptions = {
  apiVersion: '0.0.2'
};

const responseModel = Joi.object({
  status: Joi.string(),
  version: Joi.number(),
  provider: Joi.string()
}).label('Result');

server.connection({
  port: process.env.PORT || 3000
});

server.route({
  method: 'GET',
  path: '/api/status',
  config: {
    handler: (request, reply) => {
      reply({
        status: 'All systems are operational [GREEN]',
        version: 'API v1 [0.0.2-alpha]',
        provider: 'Montway Gateway API Services'
      });
    },
    description: 'Base API Status',
    notes: 'Returns the current version and status of the API',
    tags: ['api'],
    validate: {
      params: {
        test: Joi.string()
                 .description('Would you like to play with this API?')
      }
    },
    response: {schema: responseModel}
  }
});

server.register([
  Inert,
  Vision,
  {
    register: HapiSwagger,
    options: swaggerOptions
  },{
    register: require('good'),
    options: {
      reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
      }]
    }
  }], (err) => {
    server.start(() => {
      console.log('Server running at: ' + server.info.uri);
    });
  })
