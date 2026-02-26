const { restCountriesAxios } = require('../config/axios.config');
const { APIError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');


class RestCountriesProvider {
  async getCountryByCode(code) {
    try {
      logger.debug(`[RestCountries] Fetching country: ${code}`);

      const response = await restCountriesAxios.get(`/alpha/${code}`, {
        params: {
          fields: 'cca2,cca3,name,capital,region,currencies,languages,population,timezones,flags'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new NotFoundError('Country', code);
      }

      const countryData = Array.isArray(response.data) ? response.data[0] : response.data;

      logger.debug(`[RestCountries] Successfully fetched: ${code}`);
      return this._transformData(countryData);

    } catch (error) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        logger.warn(`[RestCountries] Country not found: ${code}`);
        throw new NotFoundError('Country', code);
      }

      if (error.isOperational) {
        throw error;
      }

      logger.error(`[RestCountries] Error fetching country ${code}`, error);
      throw new APIError(
        'Failed to fetch country from REST Countries API',
        503,
        'REST_COUNTRIES_ERROR',
        { originalError: error.message }
      );
    }
  }

  async getAllCountries() {
    try {
      logger.debug('[RestCountries] Fetching all countries');

      const response = await restCountriesAxios.get('/all', {
        params: {
          fields: 'cca2,cca3,name,capital,region'
        }
      });

      return response.data.map(country => this._transformData(country));

    } catch (error) {
      logger.error('[RestCountries] Error fetching all countries', error);
      throw new APIError(
        'Failed to fetch countries from REST Countries API',
        503,
        'REST_COUNTRIES_ERROR'
      );
    }
  }

  _transformData(data) {
    return {
      code: data.cca2 || data.cca3 || null,
      cca2: data.cca2 || null,
      cca3: data.cca3 || null,
      name: data.name?.common || data.name?.official || null,
      officialName: data.name?.official || null,
      capital: data.capital?.[0] || null,
      region: data.region || null,
      subregion: data.subregion || null,
      currencies: this._extractCurrencies(data.currencies),
      languages: this._extractLanguages(data.languages),
      population: data.population || null,
      timezones: data.timezones || [],
      flag: data.flags?.svg || data.flags?.png || null,
      flagEmoji: data.flag || null
    };
  }

  _extractCurrencies(currencies) {
    if (!currencies) return [];

    return Object.entries(currencies).map(([code, currency]) => ({
      code,
      name: currency.name,
      symbol: currency.symbol || null
    }));
  }

  _extractLanguages(languages) {
    if (!languages) return [];

    return Object.entries(languages).map(([code, name]) => ({
      code,
      name
    }));
  }
}

module.exports = new RestCountriesProvider();
