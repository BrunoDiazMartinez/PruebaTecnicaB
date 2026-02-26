const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Continent {
    "Continent code"
    code: String
    "Continent name"
    name: String!
  }

  """
  Additional metadata about the country
  """
  type CountryMetadata {
    "2-letter country code"
    cca2: String
    "3-letter country code"
    cca3: String
    "Official name of the country"
    officialName: String
    "Native name of the country"
    nativeName: String
    "Geographic region"
    region: String
    "Geographic subregion"
    subregion: String
    "Continent information"
    continent: Continent
    "List of states/provinces"
    states: [String!]
    "Emoji representation"
    emoji: String
    "Flag emoji"
    flagEmoji: String
  }

  """
  Country information with comprehensive data from multiple sources
  """
  type Country {
    "Country code (ISO 3166-1)"
    code: ID!
    "Country name"
    name: String!
    "Capital city"
    capital: String!
    "Continent name"
    continent: String!
    "Currency information"
    currency: String!
    "List of spoken languages"
    languages: [String!]!
    "Population count"
    population: Int!
    "List of timezones"
    timezones: [String!]!
    "Flag image URL or emoji"
    flag: String
    "Additional metadata"
    metadata: CountryMetadata
  }

  """
  Response wrapper for multiple countries
  """
  type CountriesResponse {
    "Success status"
    success: Boolean!
    "Number of countries returned"
    count: Int!
    "Array of countries"
    data: [Country!]!
  }

  """
  Response wrapper for single country
  """
  type CountryResponse {
    "Success status"
    success: Boolean!
    "Country data"
    data: Country!
  }

  """
  Error type for GraphQL errors
  """
  type Error {
    "Error message"
    message: String!
    "Error code"
    code: String!
    "HTTP status code"
    statusCode: Int
    "Additional error details"
    details: String
  }

  """
  Root Query type
  """
  type Query {
    """
    Get a country by its code (ISO 3166-1 alpha-2 or alpha-3)
    
    Examples:
    - country(code: "US")
    - country(code: "USA")
    - country(code: "MX")
    """
    country(code: ID!): Country!

    """
    Get all countries
    
    Returns a list of all available countries with their information
    """
    countries: [Country!]!
  }
`;

module.exports = typeDefs;
