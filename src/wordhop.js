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
//const actions_slack = require('./actions_slack')
//const actions_messenger = require('./actions_messenger')
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

    this.wordhop = require('wordhop')(config.apiKey, config.clientKey)
    this.wordhop.on('chat response', function (msg) { 
      console.log(msg)
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
          //message.text = ""
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

  convertToFacebookMessage(message) {

    var facebook_message = {
        recipient: {},
        message: message.sender_action ? undefined : {}
    }

    if (typeof(message.channel) == 'string' && message.channel.match(/\+\d+\(\d\d\d\)\d\d\d\-\d\d\d\d/)) {
        facebook_message.recipient.phone_number = message.channel
    } else {
        facebook_message.recipient.id = message.channel
    }

    if (!message.sender_action) {
        if (message.text) {
            facebook_message.message.text = message.text
        }

        if (message.attachment) {
            facebook_message.message.attachment = message.attachment
        }

        if (message.sticker_id) {
            facebook_message.message.sticker_id = message.sticker_id
        }

        if (message.quick_replies) {

            // sanitize the length of the title to maximum of 20 chars
            var titleLimit = function(title) {
                if (title.length > 20) {
                    var newTitle = title.substring(0, 16) + '...'
                    return newTitle
                } else {
                    return title
                }
            }

            facebook_message.message.quick_replies = message.quick_replies.map(function(item) {
                var quick_reply = {}
                if (item.content_type === 'text' || !item.content_type) {
                    quick_reply = {
                        content_type: 'text',
                        title: titleLimit(item.title),
                        payload: item.payload,
                        image_url: item.image_url,
                    }
                } else if (item.content_type === 'location') {
                    quick_reply = {
                        content_type: 'location'
                    }
                } else {
                    // Future quick replies types
                }
                return quick_reply
            })
        }
    } else {
        facebook_message.sender_action = message.sender_action
    }

    if (message.sender_action) {
        facebook_message.sender_action = message.sender_action
    }

    if (message.notification_type) {
        facebook_message.notification_type = message.notification_type
    }

    //Add Access Token to outgoing request
    if (message.access_token) {
        facebook_message.access_token = message.access_token
    } else {
        facebook_message.access_token = configuration.access_token
    }
    return facebook_message
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
    return this.wordhop.hopIn(message, {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "button",
          "text": "What do you want to do next?",
          "buttons": [{
            "type": "web_url",
            "url": "https://petersapparel.parseapp.com",
            "title": "Show Website"
          }, {
            "type": "postback",
            "title": "Start Chatting",
            "payload": "USER_DEFINED_PAYLOAD"
          }]
        }
      }
    })
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
