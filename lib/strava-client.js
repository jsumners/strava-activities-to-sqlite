'use strict'

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = require('./constants')
const BASE_URL = 'https://www.strava.com/api/v3'
const log = require('./logger')
const got = require('got')
const FormData = require('form-data')

module.exports = {
  getActivities,
  getAuthContext
}

async function getAuthContext ({ authCode }) {
  log.debug('acquiring api access context')
  const formData = new FormData()
  formData.append('client_id', STRAVA_CLIENT_ID)
  formData.append('client_secret', STRAVA_CLIENT_SECRET)
  formData.append('code', authCode)
  formData.append('grant_type', 'authorization_code')
  const response = await got.post(`${BASE_URL}/oauth/token`, {
    body: formData
  })
  return JSON.parse(response.body)
}

async function getActivities ({ authContext }) {
  const response = await got(`${BASE_URL}/athlete/activities`, {
    headers: {
      authorization: `Bearer ${authContext.access_token}`
    }
  })
  log.debug('response headers', response.headers)
  return JSON.parse(response.body)
}
