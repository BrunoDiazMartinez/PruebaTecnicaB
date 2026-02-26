require('dotenv').config();

const config = {
  server: {
    host: process.env.host,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  apis: {
    restCountries: {
      baseURL: process.env.REST_COUNTRIES_API_URL,
      timeout: parseInt(process.env.API_TIMEOUT)
    },
    graphqlCountries: {
      url: process.env.GRAPHQL_COUNTRIES_API_URL,
      timeout: parseInt(process.env.API_TIMEOUT)
    }
  },

  graphql: {
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    path: '/graphql'
  },

  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, ''))
        : ['http://localhost:4200'];
      
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, '');
      
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

const validateConfig = () => {
  const required = [
    'server.port',
    'apis.restCountries.baseURL',
    'apis.graphqlCountries.url'
  ];

  const missing = required.filter(key => {
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value[k];
      if (!value) return true;
    }
    return false;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

validateConfig();

module.exports = config;
