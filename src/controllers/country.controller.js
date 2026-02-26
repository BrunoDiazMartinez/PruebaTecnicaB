// Controlador de Países: Maneja las peticiones HTTP relacionadas con países, delegando la lógica al servicio
const countryService = require('../services/country.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class CountryController {
  async getCountryByCode(req, res) {
    const { code } = req.params;

    logger.debug(`[CountryController] GET /api/countries/${code}`);

    const countryData = await countryService.getCountryByCode(code);

    res.status(200).json({
      success: true,
      data: countryData
    });
  }

  async getAllCountries(req, res) {
    logger.debug('[CountryController] GET /api/countries');

    const countries = await countryService.getAllCountries();

    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries
    });
  }
}

module.exports = new CountryController();
