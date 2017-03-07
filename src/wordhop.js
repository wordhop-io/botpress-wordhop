/**
 * Wordhop
 *
 * This file contains one class Wordhop, which in charge of communication between
 * botpress and wordhop.
 *
 */

const Promise = require('bluebird')
const EventEmitter = require('eventemitter2')
const crypto = require('crypto')
const fetch = require('node-fetch')
const _ = require('lodash')
const bodyParser = require('body-parser')
const actions_slack = require('./actions_slack')
const actions_messenger = require('./actions_messenger')
fetch.promise = Promise

const normalizeString = function(str) {
  return str.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase()
}

class Wordhop extends EventEmitter {
  constructor(bp, config) {
    super()
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config')
    }

    this.setConfig(config)

    this.app = bp.getRouter('botpress-wordhop', {
      'bodyParser.json': false,
      'auth': req => !/\/webhook/i.test(req.originalUrl)
    })

    this.wordhop = require('wordhop')(config.apiKey, config.clientKey,{platform:config.platform, token:config.token})

    this.wordhop.on('chat response', function (msg) { 
      var slack_user
      if (msg.slack_user) {
        slack_user = msg.slack_user
      }
      var ts
      if (msg.ts) {
        ts = msg.ts
      }
      if (/[a-zA-Z]+/.test(msg.channel)) {
        msg = actions_slack.createText(msg.channel, msg.text)
      } else {
        msg = actions_messenger.createText(msg.channel, msg.text)  
      }
      msg.raw.slack_user = slack_user
      msg.raw.ts = ts
      bp.events.emit('wordhop.chat_response', msg)
      bp.middlewares.sendOutgoing(msg)
    })

  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config)
  }

  getConfig() {
    return this.config
  }

  hopIn(platform, message) {
    this.wordhop.setPlatform(platform)
    return this.wordhop.hopIn(message)
  }

  hopOut(platform, message) {
    this.wordhop.setPlatform(platform)
    return this.wordhop.hopOut(message)
  }

  logUnkownIntent(platform, message) {
    this.wordhop.setPlatform(platform)
    return this.wordhop.logUnkownIntent(message)
  }

  assistanceRequested(platform, message) {
    this.wordhop.setPlatform(platform)
    return this.wordhop.assistanceRequested(message)
  }



  module(factory) {
    return factory.apply(this, [ this ])
  }

  
}

module.exports = Wordhop
