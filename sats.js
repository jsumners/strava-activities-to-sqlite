'use strict'

const { APP_DOMAIN, STRAVA_CLIENT_ID } = require('./lib/constants')
const authorizeUrl = [
  'https://www.strava.com/oauth/authorize',
  `?client_id=${STRAVA_CLIENT_ID}`,
  '&response_type=code',
  `&redirect_uri=${encodeURIComponent('https://' + APP_DOMAIN + '/exchange_token')}`,
  '&approval_prompt=force',
  '&scope=read,read_all,activity:read_all'
].join('')

const { boolean } = require('boolean')
const open = require('open')
const log = require('./lib/logger')
const stravaClient = require('./lib/strava-client')

const dbPath = process.argv[2]
if (!dbPath) {
  log.error('must provide a db file as the first argument')
  process.exit(1)
}
const db = require('./lib/database')({ dbPath })

// Allow specifying a date to start for retreiving activities.
// This overrides the automatic detection of the most recent activity through
// what has already been recorded in the database.
const startDateArg = process.argv[3]
let startDate
if (startDateArg && isNaN(Date.parse(startDateArg)) === false) {
  startDate = startDateArg
}

const authServer = require('./lib/auth-server')()
authServer.on('ready', () => open(authorizeUrl))
authServer.on('error', (error) => {
  log.error(error)
  authServer.fastify.close()
  process.exit(1)
})
authServer.on('done', async (authResponse) => {
  authServer.fastify.close()
  await main(authResponse)
  process.exit(0)
})

async function main (args) {
  const authContext = await stravaClient.getAuthContext(args)
  log.debug('api access context: %j', authContext)

  let afterDate = startDate
  if (afterDate === undefined) {
    const mostRecentActivity = db.mostRecentActivity()
    afterDate = mostRecentActivity ? mostRecentActivity.start_date : null
  }

  for await (const activities of stravaClient.getActivities({ authContext, after: afterDate })) {
    activities.forEach(act => {
      log.info('adding activity %s', act.id)
      db.addActivity({
        id: act.id + '',
        name: act.name,
        distance: act.distance,
        moving_time: act.moving_time,
        elapsed_time: act.elapsed_time,
        total_elevation_gain: act.total_elevation_gain,
        type: act.type,
        manual: boolean(act.manual) === true ? 1 : 0,
        trainer: boolean(act.trainer) === true ? 1 : 0,
        start_date: act.start_date,
        start_date_local: act.start_date_local,
        timezone: act.timezone,
        utc_offset: act.utc_offset,
        description: act.description,
        gear_id: act.gear_id,
        average_speed: act.average_speed,
        max_speed: act.max_speed,
        average_cadence: act.average_cadence,
        average_temp: act.average_temp,
        average_watts: act.average_watts,
        kilojoules: act.kilojoules,
        average_heartrate: act.average_heartrate,
        max_heartrate: act.max_heartrate,
        elev_high: act.elev_high,
        elev_low: act.elev_low
      })
    })
  }

  const distinctGearIds = db.distinctGearIds()
  const knownGearIds = db.knownGearIds()
  log.debug({ distinctGearIds, knownGearIds })
  for (const gearId of distinctGearIds) {
    if (knownGearIds.includes(gearId)) continue
    const gearInfo = await stravaClient.getGear({ authContext, gearId })
    log.debug('adding gear: %s', gearInfo.id)
    db.addGear({
      id: gearInfo.id,
      brand_name: gearInfo.brand_name,
      model_name: gearInfo.model_name,
      frame_type: gearInfo.frame_type,
      description: gearInfo.description
    })
  }

  db.close()
  log.info('done')
}
