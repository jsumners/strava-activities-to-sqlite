'use strict'

const { LOG_LEVEL } = require('./constants')
const log = require('pino')({
  level: LOG_LEVEL || 'info',
  prettyPrint: true,
  base: null,
  timestamp () {
    return ',"time":"' + new Date().toLocaleTimeString() + '"'
  }
})
module.exports = log
