'use strict'

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = require('./constants')
const BASE_URL = 'https://www.strava.com/api/v3'
const log = require('./logger')
const got = require('got')
const FormData = require('form-data')

module.exports = {
  getActivities,
  getAuthContext,
  getGear
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
 * of the OAuth authorization flow. Must have an `access_token` property.
 * @param {string} [input.after] An RFC3339 date and time string. Will be used
 * to limit the returned activities to ones that have occurred after the
 * specified string. Defaults to the current day minus one.
 */
async function * getActivities ({ authContext, after = null }) {
  const PER_PAGE = 100
  let pageNum = 1
  let shouldContinue = true
  let normalizedAfter = Math.floor(new Date().getTime() / 1000) - 86400

  if (after !== null) {
    log.debug('normalizing date: %s', after)
    normalizedAfter = Math.floor(new Date(after).getTime() / 1000)
  }
  log.debug('normalized date: %s', normalizedAfter)

  do {
    const response = await got(`${BASE_URL}/athlete/activities`, {
      responseType: 'json',
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
    const activities = response.body
    if (activities.length < PER_PAGE) {
      shouldContinue = false
    }

    // Loop over all found activities and get the _detailed_ activity data.
    for (const [index, activity] of activities.entries()) {
      log.debug('getting full activity data for id: %s', activity.id)
      const activityUrl = `${BASE_URL}/activities/${activity.id}`
      const response = await got(activityUrl, {
        responseType: 'json',
        headers: {
          authorization: `Bearer ${authContext.access_token}`
        }
      })
      activities[index] = response.body
    }

    yield activities
  } while (shouldContinue === true)
}

async function getGear ({ authContext, gearId }) {
  const response = await got(`${BASE_URL}/gear/${gearId}`, {
    headers: {
      authorization: `Bearer ${authContext.access_token}`
    }
  })
  return JSON.parse(response.body)
}
