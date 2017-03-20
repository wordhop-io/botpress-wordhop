With Wordhop, humans and bots can tag team on conversations and delight your customers 24/7.  Connect a Slack team to Wordhop and connect Bots to Wordhop.  You can then monitor bots from Slack and take over live. You can use your own human agents, or invite outsourced human agents to a Slack channel to collaborate with your bot on customer service.  Wordhop alerts a Slack channel when a human should take over for a bot and then opens up a channel for you to chat live with your customer.  Wordhop will automatically resume your bot when you stop engaging with your customer and maintains a transcript of all bot and human interactions with each customer.   Wordhop supports bots built on Messenger and Slack.  Connect a bot in minutes and Wordhop begins working immediately.  

BONUS: Get core bot analytics delivered to Slack so you can identify bottlenecks in your conversational experience and optimize for results.

Step 1:  [Add Wordhop to Slack](https://slack.com/oauth/authorize?scope=users:read,users:read.email,commands,chat:write:bot,chat:write:user,channels:read,channels:history,files:write:user,channels:write,bot&client_id=23850726983.39760486257).

Step 2:  Tell the Wordhop bot about your bot.

Step 3:  Get your API Key and a Client Key.

Step 4:  Return to this screen and enter your keys in the form above.

Step 5:  Send your bot an intent you know it won't understand and you should receive an alert in Slack. 

Step 6: Add custom triggers to alert you in slack when a user may need assistance, such as when a user says 'human'. See example below:

```js
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
