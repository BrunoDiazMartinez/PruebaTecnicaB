/**
 * Countries GraphQL Provider
 * Handles communication with Countries GraphQL API (https://countries.trevorblades.com)
 * @module providers/countriesGraphql
 */

const { graphqlCountriesAxios } = require('../config/axios.config');
const { APIError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Countries GraphQL Provider Class
 * Encapsulates all interactions with the Countries GraphQL API
 */
class CountriesGraphqlProvider {
  /**
   * Get country information by country code
   * @param {string} code - ISO 3166-1 alpha-2 country code
   * @returns {Promise<Object>} Country data from GraphQL API
   * @throws {NotFoundError} If country not found
   * @throws {APIError} If API request fails
   */
  async getCountryByCode(code) {
    try {
      logger.debug(`[CountriesGraphQL] Fetching country: ${code}`);

      const query = `
        query GetCountry($code: ID!) {
          country(code: $code) {
            code
            name
            native
            capital
            continent {
              code
              name
            }
            currencies
            languages {
              code
              name
              native
            }
            emoji
            emojiU
            states {
              name
            }
          }
        }
      `;

      const response = await graphqlCountriesAxios.post('', {
        query,
        variables: { code: code.toUpperCase() }
      });

      if (response.data.errors) {
        const error = response.data.errors[0];
        logger.warn(`[CountriesGraphQL] GraphQL error: ${error.message}`);
        throw new APIError(
          error.message,
          400,
          'GRAPHQL_ERROR',
          { errors: response.data.errors }
        );
      }

      if (!response.data.data || !response.data.data.country) {
        logger.warn(`[CountriesGraphQL] Country not found: ${code}`);
        throw new NotFoundError('Country', code);
      }

      const countryData = response.data.data.country;
      logger.debug(`[CountriesGraphQL] Successfully fetched: ${code}`);

      return this._transformData(countryData);

    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      logger.error(`[CountriesGraphQL] Error fetching country ${code}`, error);
      throw new APIError(
        'Failed to fetch country from Countries GraphQL API',
        503,
        'GRAPHQL_COUNTRIES_ERROR',
        { originalError: error.message }
      );
    }
  }

  async getAllCountries() {
    try {
      logger.debug('[CountriesGraphQL] Fetching all countries');

      const query = `
        query GetAllCountries {
          countries {
            code
            name
            capital
            continent {
              name
            }
            emoji
          }
        }
      `;

      const response = await graphqlCountriesAxios.post('', { query });

      if (response.data.errors) {
        throw new APIError('GraphQL query failed', 400, 'GRAPHQL_ERROR');
      }

      const countries = response.data.data.countries || [];
      return countries.map(country => this._transformData(country));

    } catch (error) {
      logger.error('[CountriesGraphQL] Error fetching all countries', error);
      throw new APIError(
        'Failed to fetch countries from Countries GraphQL API',
        503,
        'GRAPHQL_COUNTRIES_ERROR'
      );
    }
  }

  async getCountriesByContinent(continentCode) {
    try {
      logger.debug(`[CountriesGraphQL] Fetching countries for continent: ${continentCode}`);

      const query = `
        query GetContinent($code: ID!) {
          continent(code: $code) {
            name
            countries {
              code
              name
              capital
              emoji
            }
          }
        }
      `;

      const response = await graphqlCountriesAxios.post('', {
        query,
        variables: { code: continentCode.toUpperCase() }
      });

      if (response.data.errors || !response.data.data.continent) {
        throw new NotFoundError('Continent', continentCode);
      }

      const countries = response.data.data.continent.countries || [];
      return countries.map(country => this._transformData(country));

    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      logger.error(`[CountriesGraphQL] Error fetching continent ${continentCode}`, error);
      throw new APIError(
        'Failed to fetch continent from Countries GraphQL API',
        503,
        'GRAPHQL_COUNTRIES_ERROR'
      );
    }
  }

  _transformData(data) {
    return {
      code: data.code || null,
      name: data.name || null,
      nativeName: data.native || null,
      capital: data.capital || null,
      continent: data.continent
        ? {
            code: data.continent.code,
            name: data.continent.name
          }
        : null,
      currencies: data.currencies || [],
      languages: this._extractLanguages(data.languages),
      emoji: data.emoji || null,
      emojiU: data.emojiU || null,
      states: data.states ? data.states.map(s => s.name) : []
    };
  }

  _extractLanguages(languages) {
    if (!languages || !Array.isArray(languages)) return [];

    return languages.map(lang => ({
      code: lang.code || null,
      name: lang.name || null,
      native: lang.native || null
    }));
  }
}

module.exports = new CountriesGraphqlProvider();
