// Servicio de Países: Agrega y normaliza datos de múltiples fuentes (REST + GraphQL)

const restCountriesProvider = require('../providers/restCountries.provider');
const countriesGraphqlProvider = require('../providers/countriesGraphql.provider');
const { ServiceError, NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class CountryService {
  // Obtiene información completa del país combinando REST y GraphQL
  async getCountryByCode(code) {
    try {
      if (!code || typeof code !== 'string') {
        throw new ValidationError('Country code is required and must be a string');
      }

      const sanitizedCode = code.trim().toUpperCase();

      if (sanitizedCode.length < 2 || sanitizedCode.length > 3) {
        throw new ValidationError('Country code must be 2 or 3 characters (ISO 3166-1)');
      }

      logger.info(`[CountryService] Getting country data for: ${sanitizedCode}`);

      // Obtener datos de ambas fuentes en paralelo
      const [restData, graphqlData] = await Promise.allSettled([
        this._fetchFromRestCountries(sanitizedCode),
        this._fetchFromGraphqlCountries(sanitizedCode)
      ]);

      if (restData.status === 'rejected' && graphqlData.status === 'rejected') {
        if (restData.reason instanceof NotFoundError && 
            graphqlData.reason instanceof NotFoundError) {
          throw new NotFoundError('Country', sanitizedCode);
        }

        logger.error('[CountryService] Both data sources failed', {
          restError: restData.reason.message,
          graphqlError: graphqlData.reason.message
        });

        throw new ServiceError(
          'Unable to retrieve country data from any source',
          503,
          'ALL_SOURCES_FAILED',
          {
            restError: restData.reason.message,
            graphqlError: graphqlData.reason.message
          }
        );
      }

      const mergedData = this._mergeCountryData(
        restData.status === 'fulfilled' ? restData.value : null,
        graphqlData.status === 'fulfilled' ? graphqlData.value : null
      );

      const normalizedData = this._normalizeCountryData(mergedData);

      logger.info(`[CountryService] Successfully retrieved data for: ${sanitizedCode}`);
      return normalizedData;

    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      logger.error('[CountryService] Unexpected error in getCountryByCode', error);
      throw new ServiceError(
        'Failed to process country request',
        500,
        'SERVICE_ERROR',
        { originalError: error.message }
      );
    }
  }

  async getAllCountries() {
    try {
      logger.info('[CountryService] Getting all countries');

      const countries = await restCountriesProvider.getAllCountries();
      
      return countries.map(country => this._normalizeCountryData(country));

    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      logger.error('[CountryService] Error getting all countries', error);
      throw new ServiceError('Failed to retrieve countries list', 500, 'SERVICE_ERROR');
    }
  }

  async _fetchFromRestCountries(code) {
    try {
      return await restCountriesProvider.getCountryByCode(code);
    } catch (error) {
      logger.warn(`[CountryService] REST Countries failed for ${code}: ${error.message}`);
      throw error;
    }
  }

  async _fetchFromGraphqlCountries(code) {
    try {
      const code2Letter = code.length === 2 ? code : code.substring(0, 2);
      return await countriesGraphqlProvider.getCountryByCode(code2Letter);
    } catch (error) {
      logger.warn(`[CountryService] GraphQL Countries failed for ${code}: ${error.message}`);
      throw error;
    }
  }

  _mergeCountryData(restData, graphqlData) {
    if (!restData) return graphqlData;
    if (!graphqlData) return restData;

    return {
      code: restData.cca2 || graphqlData.code || restData.code,
      cca2: restData.cca2,
      cca3: restData.cca3,
      name: restData.name || graphqlData.name,
      nativeName: graphqlData.nativeName || restData.name,
      officialName: restData.officialName,
      capital: restData.capital || graphqlData.capital,
      region: restData.region,
      subregion: restData.subregion,
      continent: graphqlData.continent || (restData.region ? { name: restData.region } : null),
      currencies: this._mergeCurrencies(restData.currencies, graphqlData.currencies),
      languages: this._mergeLanguages(restData.languages, graphqlData.languages),
      population: restData.population,
      timezones: restData.timezones || [],
      flag: restData.flag,
      flagEmoji: restData.flagEmoji || graphqlData.emoji,
      emoji: graphqlData.emoji,
      states: graphqlData.states || []
    };
  }

  _mergeCurrencies(restCurrencies, graphqlCurrencies) {
    if (!restCurrencies || restCurrencies.length === 0) {
      return graphqlCurrencies || [];
    }
    return restCurrencies;
  }

  _mergeLanguages(restLanguages, graphqlLanguages) {
    if (!restLanguages || restLanguages.length === 0) {
      return graphqlLanguages || [];
    }

    if (graphqlLanguages && graphqlLanguages.length > 0) {
      return restLanguages.map(restLang => {
        const graphqlLang = graphqlLanguages.find(
          gl => gl.code === restLang.code || gl.name === restLang.name
        );
        
        return graphqlLang
          ? { ...restLang, native: graphqlLang.native }
          : restLang;
      });
    }

    return restLanguages;
  }

  _normalizeCountryData(data) {
    return {
      code: data.code || data.cca2 || data.cca3,
      name: data.name,
      capital: data.capital || 'N/A',
      continent: data.continent?.name || data.region || 'Unknown',
      currency: this._formatCurrency(data.currencies),
      languages: this._formatLanguages(data.languages),
      population: data.population || 0,
      timezones: data.timezones || [],
      flag: data.flag || data.flagEmoji || data.emoji || null,
      metadata: {
        cca2: data.cca2,
        cca3: data.cca3,
        officialName: data.officialName,
        nativeName: data.nativeName,
        region: data.region,
        subregion: data.subregion,
        continent: data.continent,
        states: data.states,
        emoji: data.emoji,
        flagEmoji: data.flagEmoji
      }
    };
  }

  _formatCurrency(currencies) {
    if (!currencies || currencies.length === 0) {
      return 'N/A';
    }

    if (Array.isArray(currencies) && typeof currencies[0] === 'object') {
      return currencies
        .map(c => `${c.name} (${c.code})${c.symbol ? ' ' + c.symbol : ''}`)
        .join(', ');
    }

    return currencies.join(', ');
  }

  _formatLanguages(languages) {
    if (!languages || languages.length === 0) {
      return [];
    }

    return languages.map(lang => {
      if (typeof lang === 'object') {
        return lang.native ? `${lang.name} (${lang.native})` : lang.name;
      }
      return lang;
    });
  }
}

module.exports = new CountryService();
