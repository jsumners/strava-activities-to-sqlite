'use strict'

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const log = require('./logger')

module.exports = function getDatabase ({ dbPath }) {
  const db = new Database(path.resolve(dbPath))

  const statement = db.prepare('select count(*) as tc from sqlite_master where type = \'table\' and name = \'activities\'')
  const result = statement.get()
  if (result && result.tc === 0) {
    log.debug('creating activities table')
    const createActivitiesSQL = getSQL('activities.sql')
    db.exec(createActivitiesSQL.toString())
  }

  const addActivitySQL = getSQL('add-activity.sql')
  const addActivityStatement = db.prepare(addActivitySQL.toString())
  db.addActivity = function (activity) {
    const info = addActivityStatement.run(activity)
    log.debug('added activity', info)
  }

  return db
}

function getSQL (name) {
  return fs.readFileSync(path.join(__dirname, '..', 'sql', name))
}
