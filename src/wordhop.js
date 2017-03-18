/**
 * Wordhop
 *
 * This file contains one class Wordhop, which in charge of communication between
 * botpress and wordhop.
 *
 */

class Wordhop {
  constructor(bp, config) {
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config')
    }

    this.setConfig(config)

    this.app = bp.getRouter('botpress-wordhop', {
      'bodyParser.json': false,
      'auth': req => !/\/webhook/i.test(req.originalUrl)
    })

    this.wordhop = require('wordhop')(config.apiKey, config.clientKey)
    this.wordhop.on('chat response', function (msg) {
      var platform = "facebook"
      var platformModule
      if (/[a-zA-Z]+/.test(msg.channel)) {
          platform = "slack"
          platformModule = bp.slack
      } else {
          platformModule = bp.messenger
      }
      var message = {}
      if (msg.attachments) {
          if (platformModule.createText) {
              message = platformModule.createAttachments(msg.channel, msg.attachments)
          }
      } 
      else if (platform == "facebook" && platformModule.createAttachment && msg.attachment) {
          if (msg.attachment.type == "template") {
              message = platformModule.createTemplate(msg.channel, msg.attachment.payload)
          } else if (msg.attachment.payload) {
              message = platformModule.createAttachment(msg.channel, msg.attachment.type, msg.attachment.payload.url)
          }
      }
      else if (msg.text.length > 0 && platformModule.createText) {
          message = platformModule.createText(msg.channel, msg.text)         
      }
      message.raw.slack_user = msg.slack_user
      message.raw.ts = msg.ts
      bp.events.emit('Wordhophop.chat_response', msg)
      bp.middlewares.sendOutgoing(message)
    })

  }

  setConfig(config) {
    this.config = config
  }

  getConfig() {
    return this.config
  }

  hopIn(platform, message, user) {
    this.wordhop.setPlatform(platform)
    if (user) {
        message.user_profile = user
    }
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
