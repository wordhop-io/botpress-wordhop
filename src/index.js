import _ from 'lodash'
import Promise from 'bluebird'
import Wordhop from './wordhop'
//const path = require('path')
//const fs = require('fs')
//const uuid = require('uuid')
//import createConfig from './config'
/**
 * Load config from given file path
 *
 * If the file doesn't exist,
 * then it will write default one into the given file path
 *
 * @param {string} file - the file path
 * @return {Object} config object
 */

 /*
const loadConfigFromFile = file => {

  if (!fs.existsSync(file)) {
    const config = {
      platform: '',
      clientKey: '',
      apiKey : '',
      token : ''
    }
    saveConfigToFile(config, file)
  }

  return overwriteConfig(file)
}

const overwriteConfig = file => {
  let config = JSON.parse(fs.readFileSync(file))

  if (!config.verifyToken || config.verifyToken.length <= 1) {
    config.verifyToken = uuid.v4()
    saveConfigToFile(config, file)
  }

  if (process.env.WORDHOP_PLATFORM) {
    config.platform = process.env.WORDHOP_PLATFORM
  }

  if (process.env.MESSENGER_ACCESS_TOKEN) {
    config.token = process.env.MESSENGER_ACCESS_TOKEN
  }

  if (process.env.WORDHOP_API_KEY) {
    config.apiKey = process.env.WORDHOP_API_KEY
  }

  if (process.env.WORDHOP_CLIENT_KEY) {
    config.clientKey = process.env.WORDHOP_CLIENT_KEY
  }
  
  return config
}

var saveConfigToFile = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config))
}
*/

let wordhop = null

const outgoingMiddleware = (event, next) => {
  if (wordhop === null) {
    return next()
  }
  var message = event.raw
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
  wordhop.hopIn(event.platform, event.raw).then(function (isPaused) {
    event.isPaused = isPaused
    return next()
  })
}


const postProcessingIncomingMiddleware = (event, next) => {
  if (wordhop === null) {
    return next()
  }
  if (!event.isPaused) {
    wordhop.logUnkownIntent(event.platform, event.raw)
  }
  return next()
}


module.exports = {

  config: {
    platform: { type: 'string', default: 'slack', env: 'WORDHOP_PLATFORM' },
    clientKey: { type: 'string', default: '', env: 'WORDHOP_CLIENT_KEY' },
    apiKey: { type: 'string', default: '', env: 'WORDHOP_API_KEY' },
    token: { type: 'string', default: '', env: 'WORDHOP_TOKEN' }
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
      order: 1,
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
    //const file = path.join(bp.projectLocation, bp.botfile.modulesConfigDir, 'botpress-wordhop.json')
    //const config = loadConfigFromFile(file)
    const config = await configurator.loadAll()

    
    const router = bp.getRouter('botpress-wordhop')

    /*
    router.get('/config', (req, res) => {
      console.log("config")
      res.json(config)
    })

    router.post('/config', (req, res) => {
      console.log("config post")
      setConfigAndRestart(req.body)
      res.json(config)
    })*/

    const setConfigAndRestart = async newConfigs => {
      await configurator.saveAll(newConfigs)
      //wordhop.setConfig(newConfigs)
    }

    router.get('/config', async (req, res) => {
      console.log(config)

      res.json(await configurator.loadAll())
    })

    router.post('/config', async (req, res) => {
      console.log(config)

      setConfigAndRestart(req.body)
      res.json(await configurator.load())
    })

    if (!config.apiKey|| !config.clientKey) {
        return
    }

    wordhop = new Wordhop(bp, config)

    bp.events.on('assistanceRequested', event => {
      if (event.isPaused) {
        return
      }
      wordhop.assistanceRequested(event.platform, event.raw)
    })

  }
}
