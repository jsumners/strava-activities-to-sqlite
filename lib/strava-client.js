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

/**
 * @param {object} input
 * @param {object} input.authContext Authorization context that is the result
 * of the OAuth authorization folow. Must have an `access_token` property.
 * @param {string} [input.after] An RFC3339 date and time string. Will be used
 * to limit the returned activities to ones that have occurred after the
 * specified string. Defaults to the current day minus one.
 */
async function * getActivities ({ authContext, after }) {
  const PER_PAGE = 100
  let pageNum = 1
  let shouldContinue = true
  let normalizedAfter = Math.floor(new Date().getTime() / 1000) - 86400

  if (after) {
    normalizedAfter = Math.floor(new Date(after).getTime / 1000)
  }

  do {
    const response = await got(`${BASE_URL}/athlete/activities`, {
      headers: {
        authorization: `Bearer ${authContext.access_token}`
      },
      searchParams: {
        per_page: PER_PAGE,
        page: pageNum,
        after: normalizedAfter
      }
    })

    pageNum += 1
    const activities = JSON.parse(response.body)
    if (activities.length < PER_PAGE) {
      shouldContinue = false
    }

    yield activities
  } while (shouldContinue === true)
}
