const express = require('express');
const countryController = require('../controllers/country.controller');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/countries', asyncHandler(countryController.getAllCountries));
router.get('/countries/:code', asyncHandler(countryController.getCountryByCode));

module.exports = router;
