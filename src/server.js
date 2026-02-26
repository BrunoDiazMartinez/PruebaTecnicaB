// Servidor: Inicializa Express y Apollo Server para GraphQL
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const countryRoutes = require('./routes/country.routes');
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  requestTimeout
} = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { AppError } = require('./utils/errors');

const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: config.server.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(cors(config.cors));

  if (config.server.isDevelopment) {
    app.use(morgan('dev'));
  }

  app.use(requestLogger);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(requestTimeout(30000));

  app.use('/api', countryRoutes);

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Countries API Server',
      version: '1.0.0',
      endpoints: {
        rest: {
          countries: '/api/countries',
          country: '/api/countries/:code'
        },
        graphql: {
          endpoint: config.graphql.path,
          playground: config.graphql.playground ? config.graphql.path : 'disabled'
        }
      },
      documentation: {
        rest: 'GET /api/countries/:code - Get country by code (e.g., US, MX, BR)',
        graphql: 'POST /graphql - GraphQL endpoint with playground'
      }
    });
  });

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};

const createApolloServer = (app) => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    
    context: ({ req }) => {
      return {
        req,
      };
    },

    formatError: (error) => {
      logger.error('[GraphQL] Error occurred', {
        message: error.message,
        code: error.extensions?.code,
        path: error.path
      });

      if (config.server.isProduction && error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return new AppError('An unexpected error occurred', 500, 'INTERNAL_SERVER_ERROR');
      }

      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        statusCode: error.extensions?.statusCode || 500,
        path: error.path,
        timestamp: new Date().toISOString()
      };
    },

    playground: config.graphql.playground,
    introspection: config.graphql.introspection,

    debug: config.server.isDevelopment,
    
    cache: 'bounded',
    
    validationRules: []
  });

  return apolloServer;
};

const startServer = async () => {
  try {
    const app = createApp();

    const apolloServer = createApolloServer(app);

    await apolloServer.start();

    apolloServer.applyMiddleware({
      app,
      path: config.graphql.path,
      cors: false
    });

    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Server started successfully', {
        host: config.server.host,
        port: config.server.port,
        environment: config.server.nodeEnv,
        endpoints: {
          rest: `http://${config.server.host}:${config.server.port}/api`,
          graphql: `http://${config.server.host}:${config.server.port}${apolloServer.graphqlPath}`,
          playground: config.graphql.playground
            ? `http://${config.server.host}:${config.server.port}${apolloServer.graphqlPath}`
            : 'disabled'
        }
      });
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        await apolloServer.stop();
        logger.info('Apollo Server stopped');
        
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { createApp, createApolloServer, startServer };
