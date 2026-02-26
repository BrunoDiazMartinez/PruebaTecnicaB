// Resolvers de GraphQL: Mapea operaciones GraphQL al servicio

const countryService = require('../services/country.service');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const resolvers = {
  Query: {
    country: async (parent, { code }, context) => {
      try {
        logger.debug(`[GraphQL] Query: country(code: "${code}")`);

        if (!code) {
          throw new ValidationError('Country code is required');
        }

        const countryData = await countryService.getCountryByCode(code);
        return countryData;

      } catch (error) {
        logger.error('[GraphQL] Error in country query', error);
        throw error;
      }
    },

    countries: async (parent, args, context) => {
      try {
        logger.debug('[GraphQL] Query: countries');

        const countries = await countryService.getAllCountries();
        return countries;

      } catch (error) {
        logger.error('[GraphQL] Error in countries query', error);
        throw error;
      }
    }
  },

  Country: {
    code: (parent) => {
      return parent.code?.toUpperCase() || null;
    },

    population: (parent) => {
      return parseInt(parent.population) || 0;
    },

    languages: (parent) => {
      if (!parent.languages) return [];
      if (Array.isArray(parent.languages)) return parent.languages;
      return [parent.languages];
    },

    timezones: (parent) => {
      if (!parent.timezones) return [];
      if (Array.isArray(parent.timezones)) return parent.timezones;
      return [parent.timezones];
    },

    flag: (parent) => {
      return parent.flag || parent.metadata?.emoji || null;
    }
  },

  CountryMetadata: {

    continent: (parent) => {
      if (!parent.continent) return null;
      if (typeof parent.continent === 'string') {
        return { name: parent.continent, code: null };
      }
      return parent.continent;
    },

    states: (parent) => {
      if (!parent.states) return [];
      if (Array.isArray(parent.states)) return parent.states;
      return [parent.states];
    }
  }
};

module.exports = resolvers;
