import _ from 'lodash'
import Promise from 'bluebird'
import Wordhop from './wordhop'

let wordhop = null

const outgoingMiddleware = (event, next) => {

  if (wordhop === null) {
    return next()
  }
  var message = Object.assign({}, event.raw) // Clone the raw message
  if (event.platform === "slack") {
    message.channel = event.raw.channelId
  }
  else if (event.platform === "facebook") {
    message.channel = event.raw.to
  }
  if (event.text) {
    message.text = event.text
  } else {
    message.text = ""
  }
  
  wordhop.hopOut(event.platform, message)
  return next()
}

const incomingMiddleware = (event, next) => {

  if (wordhop === null) {
    return next()
  }
  
  wordhop.hopIn(event.platform, event.raw, event.user).then(function (isPaused) {
    event.raw.paused = isPaused
    if (!isPaused) {
      return next()
    }
  })
}

const postProcessingIncomingMiddleware = (event, next) => {
  if (wordhop === null) {
    return next()
  }
  if (!event.raw.paused) {
    wordhop.logUnkownIntent(event.platform, event.raw)
  }
  return next()
}

module.exports = {

  config: {
    clientKey: { type: 'string', default: '', env: 'WORDHOP_CLIENT_KEY' },
    apiKey: { type: 'string', default: '', env: 'WORDHOP_API_KEY' }
  },

  init(bp) {

    bp.middlewares.register({
      name: 'wordhop.hopOut',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-wordhop',
      description: 'Sends out messages.'
    })

    bp.middlewares.register({
      name: 'wordhop.hopIn',
      type: 'incoming',
      order: 21,
      handler: incomingMiddleware,
      module: 'botpress-wordhop',
      description: 'Receive messages.' +
      ' This middleware should be placed at the beginning as it sets whether or not a bot is paused.'
    })

    bp.middlewares.register({
      name: 'wordhop.logUnkownIntent',
      type: 'incoming',
      order: 100,
      handler: postProcessingIncomingMiddleware,
      module: 'botpress-wordhop',
      description: 'Sends alerts to agents when your bot does not understand the user intent.' +
      ' This middleware should be placed anywhere after the `hear` handler.'
    })

  },
  ready: async function(bp, configurator) {
    const config = await configurator.loadAll()

    const router = bp.getRouter('botpress-wordhop')

    const setConfigAndRestart = async newConfigs => {
      await configurator.saveAll(newConfigs)
      if (newConfigs.apiKey && newConfigs.clientKey) {
          if (wordhop === null) {
            wordhop = new Wordhop(bp, newConfigs)
          }
          wordhop.setConfig(newConfigs)
      }
    }

    router.get('/config', async (req, res) => {
      res.json(await configurator.loadAll())
    })

    router.post('/config', async (req, res) => {
      setConfigAndRestart(req.body)
      res.json(await configurator.loadAll())
    })

    bp.events.on('assistanceRequested', event => {
      if (wordhop === null) {
        return
      }
      if (event.raw.paused) {
        return
      }
      wordhop.assistanceRequested(event.platform, event.raw)
    })

    if (config.apiKey && config.clientKey) {
        wordhop = new Wordhop(bp, config)
    }

  }
}
