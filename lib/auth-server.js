
const { PORT } = require('./constants')
const { EventEmitter } = require('events')
const fastify = require('fastify')

module.exports = function getServer () {
  const authServer = new EventEmitter()
  const server = fastify({ logger: false })

  server.route({
    path: '/exchange_token',
    method: 'GET',
    async handler (req, res) {
      if (req.query.error) {
        authServer.emit('error', Error('failed to acquire authorization'))
        return res.send('Failed authorization.')
      }

      res.send('App authorized. You may close this page.')
      authServer.emit('done', { authCode: req.query.code, scope: req.query.scope })
    }
  })

  server.listen(PORT || 8000, (err) => {
    if (err) {
      authServer.emit('error', err)
      return
    }
    authServer.emit('ready')
  })

  authServer.fastify = server
  return authServer
}
