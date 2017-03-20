# [Wordhop](https://www.Wordhop.io) - SDK For Human + AI Conversational Experiences

Bots enable businesses to respond to customers immediately but they often fail to understand user intent.  According to Facebook, bots fail 70% of the time. Wordhop helps solve this problem with a toolkit to easily keep humans in the loop when AI fails your customers.    The solution includes an SDK for bot developers to connect their bots to Slack, and a Slack app to get alerts, then pause and take over a bot.

![Solution](https://cloud.githubusercontent.com/assets/7429980/22609969/491afe58-ea31-11e6-8928-27e1a1f1d6bd.png)



You can integrate Wordhop in minutes and it begins working immediately. 

### What you can do with Wordhop:
You can view a full list of features at (https://www.wordhop.io).  It's core purpose can be explained with this single GIF  

![Takeover](https://cloud.githubusercontent.com/assets/7429980/22609935/22e39740-ea31-11e6-8286-e5a3ae545565.gif)


### What you need to get started:
* [A Slack Account](http://www.slack.com)
* [Wordhop for Slack](https://slack.com/oauth/authorize?scope=users:read,users:read.email,commands,chat:write:bot,chat:write:user,channels:read,channels:history,channels:write,bot&client_id=23850726983.39760486257)
* [Botpress with Messenger and/or Slack module installed](https://botpress.io/)

##### Operational Dependencies:
1.  You'll need an API key from Wordhop and for each Chatbot a Bot Token.  You can get both of those (free) when you add Wordhop to Slack and through a conversation with Wordhop. 
2.  A Messenger and/or Slack module set up in Botpress. 


### Installation
Installing modules on Botpress is simple. By using CLI, users only need to type this command in their terminal to add Wordhop module to their bot.
```bash
$ botpress install wordhop
```
It's also possible to install it through the Botpress UI in the modules section.


### Usage
Wordhop will immediately start alerting you when your bot has no response, and when your users say something with a negative sentiment. You can also set up custom alerts, such as when a user requests assistance.

##### Dial 0 to Speak With a Live Human Being:

Wordhop can trigger alerts to suggest when a human should take over for your Chatbot. To enable this, create an intent such as when a customer explicitly requests live assistance, and then include the following lines of code where your bot listens for this intent:

```javascript
// match an intent to talk to a real human
bp.hear({ type: 'message', text: 'human' }, (event, next) => {
  // let the user know that they are being routed to a human
  var responseText = 'Hang tight. A human is on the way.'
  if (event.platform == "facebook") {
    bp.messenger.sendText(event.user.id, responseText)
  } else if (event.platform == "slack") {
    bp.slack.sendText(event.channel.id, responseText)
  }
  // send a Wordhop alert to your slack channel
  // that the user could use assistance
  bp.events.emit('assistanceRequested', {platform: event.platform, raw: event.raw})
})
```


Go back to Slack and wait for alerts. That's it! 
[Be sure to check out our examples.](./examples/)


### Looking for something we don't yet support?  
* [Join our mailing list and we'll notifiy you](https://www.wordhop.io/contact.html)
* [Contact Support](mailto:support@wordhop.io)
