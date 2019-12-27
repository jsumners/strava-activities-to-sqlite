'use strict'

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const log = require('./logger')

module.exports = function getDatabase ({ dbPath }) {
  const db = new Database(path.resolve(dbPath))

  initDB(db)

  const addActivitySQL = getSQL('add-activity.sql')
  const addActivityStatement = db.prepare(addActivitySQL.toString())
  db.addActivity = function (activity) {
    try {
      const info = addActivityStatement.run(activity)
      log.debug('added activity', info)
    } catch (error) {
      log.error(error)
    }
  }

  const mostRecentActivitySQL = getSQL('most-recent-activity.sql')
  const mostRecentActivityStatement = db.prepare(mostRecentActivitySQL.toString())
  db.mostRecentActivity = function () {
    return mostRecentActivityStatement.get()
  }

  const distinctGearIdsSQL = getSQL('distinct-gear-ids.sql')
  const distinctGearIdsStatement = db.prepare(distinctGearIdsSQL.toString())
  db.distinctGearIds = function () {
    const result = distinctGearIdsStatement.all()
    return result.map(r => r.gear_id)
  }

  const knownGearIdsSQL = getSQL('known-gear-ids.sql')
  const knownGearIdsStatement = db.prepare(knownGearIdsSQL.toString())
  db.knownGearIds = function () {
    const result = knownGearIdsStatement.all()
    return result.map(r => r.id)
  }

  const addGearSQL = getSQL('add-gear.sql')
  const addGearStatement = db.prepare(addGearSQL.toString())
  db.addGear = function (gear) {
    try {
      const info = addGearStatement.run(gear)
      log.debug('added gear', info)
    } catch (error) {
      log.error(error)
    }
  }

  return db
}

function getSQL (name) {
  return fs.readFileSync(path.join(__dirname, '..', 'sql', name))
}

function initDB (db) {
  let statement = db.prepare('select count(*) as tc from sqlite_master where type = \'table\' and name = \'activities\'')
  let result = statement.get()
  if (result && result.tc === 0) {
    log.debug('creating activities table')
    const createActivitiesSQL = getSQL('create-activities.sql')
    db.exec(createActivitiesSQL.toString())
  }

  statement = db.prepare('select count(*) as tc from sqlite_master where type = "table" and name = "gear"')
  result = statement.get()
  if (result && result.tc === 0) {
    log.debug('creating gear table')
    const createGearSQL = getSQL('create-gear.sql')
    db.exec(createGearSQL.toString())
  }
}
