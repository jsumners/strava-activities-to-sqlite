'use strict'

require('dotenv').config()
const constants = {};

[
  'APP_DOMAIN',
  'PORT',
  'LOG_LEVEL',
  'STRAVA_CLIENT_ID',
  'STRAVA_CLIENT_SECRET'
].forEach(c => { constants[c] = process.env[c] })

module.exports = constants
