'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const mongoose = require('mongoose');

const server = new Hapi.Server();

const Beer = require('./models/beer');

const swaggerOptions = {
  apiVersion: '0.0.2'
};

const responseModel = Joi.object({
  status: Joi.string(),
  version: Joi.string(),
  provider: Joi.string()
}).label('Result');

mongoose.connect('mongodb://localhost:27017/beerlocker');

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

server.route({
  method: 'POST',
  path: '/api/beers',
  handler: (request, reply) => {
    const beer = Object.assign(new Beer(), request.payload);
    beer.save((err) => {
      if (err) reply(err).code(500);

      reply({ message: 'Beer added to the locker!', data: beer });
    });
  },
  config: {
    validate: {
      payload: {
        name: Joi.string().required(),
        type: Joi.string().required(),
        quantity: Joi.number().required()
      }
    },
    description: 'Beer Creation Route',
    notes: 'Allows for the creation of a new beer',
    tags: ['api', 'beer']
  }
});

server.route({
  method: 'GET',
  path: '/api/beers',
  handler: (request, reply) => {
    Beer.find((err, beers) => {
      if (err) reply(err).code(500);

      reply(beers);
    });
  },
  config: {
    tags: ['api', 'beer']
  }
});

server.route({
  method: 'GET',
  path: '/api/beers/{beer_id}',
  handler: (request, reply) => {
    Beer.findById(request.params.beer_id, (err, beer) => {
      if (err) reply(err)

      reply(beer);
    });
  },
  config: {
    tags: ['api', 'beer'],
    description: 'Single Beer Request',
    notes: 'Lookup a single beer, perhaps have a drink',
    validate: {
      params: {
        beer_id: Joi.string().required()
      }
    }
  }
});

server.route({
  method: 'PUT',
  path: '/api/beers/{beer_id}',
  handler: (request, reply) => {
    Beer.findById(request.params.beer_id, (err, beer) => {
      if (err) reply(err).code(404);

      Object.assign(beer, {
        quantity: request.payload.quantity
      })
      .save((err) => {
        if (err) reply(err).code(500);

        reply(beer);
      });
    });
  },
  config: {
    tags: ['api', 'beer'],
    description: 'Update the quantity',
    notes: 'Update the quantity to the level of beer remaining',
    validate: {
      params: {
        beer_id: Joi.string().required()
      },
      payload: {
        quantity: Joi.number().required()
      }
    }
  }
});

const beerHandler = {
  delete: (request, reply) => {
    Beer.findByIdAndRemove(request.params.beer_id, (err) => {
      if (err) reply(err).code(409);

      reply({ message: 'Beer has been removed from the locker' });
    });
  }
};

server.route({
  method: 'DELETE',
  path: '/api/beers/{beer_id}',
  handler: beerHandler.delete,
  config: {
    tags: ['api', 'beer'],
    description: 'Delete a beer',
    notes: 'Deletes the entire beer from the collection',
    validate: {
      params: {
        beer_id: Joi.string().required()
      }
    }
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
