const axios = require('axios');
const config = require('./index');
const { APIError } = require('../utils/errors');

const createAxiosInstance = (options) => {
  const instance = axios.create(options);

  instance.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      if (error.code === 'ECONNABORTED') {
        throw new APIError('Request timeout', 504, 'TIMEOUT');
      }

      if (!error.response) {
        throw new APIError('Network error - Unable to reach external API', 503, 'NETWORK_ERROR');
      }

      const { status, data } = error.response;
      throw new APIError(
        data?.message || 'External API error',
        status,
        'EXTERNAL_API_ERROR',
        data
      );
    }
  );

  return instance;
};

const restCountriesAxios = createAxiosInstance({
  baseURL: config.apis.restCountries.baseURL,
  timeout: config.apis.restCountries.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const graphqlCountriesAxios = createAxiosInstance({
  baseURL: config.apis.graphqlCountries.url,
  timeout: config.apis.graphqlCountries.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

module.exports = {
  restCountriesAxios,
  graphqlCountriesAxios,
  createAxiosInstance
};
