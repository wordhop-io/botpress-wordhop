import React from 'react'

import {
  Form,
  FormGroup,
  FormControl,
  Grid,
  Row,
  Col,
  Button,
  ControlLabel,
  Link,
  Checkbox
} from 'react-bootstrap'

import Markdown from 'react-markdown'
import _ from 'lodash'

import style from './style.scss'

const documentation = {
  default: `

  With Wordhop, humans and bots can tag team on conversations and delight your customers 24/7.  Connect a Slack team to Wordhop and connect Bots to Wordhop.  You can then monitor bots from Slack and take over live. You can use your own human agents, or invite outsourced human agents to a Slack channel to collaborate with your bot on customer service.  Wordhop alerts a Slack channel when a human should take over for a bot and then opens up a channel for you to chat live with your customer.  Wordhop will automatically resume your bot when you stop engaging with your customer and maintains a transcript of all bot and human interactions with each customer.   Wordhop supports bots built on Messenger and Slack.  Connect a bot in minutes and Wordhop begins working immediately.  

  BONUS: Get core bot analytics delivered to Slack so you can identify bottlenecks in your conversational experience and optimize for results.

  Step 1:  [Add Wordhop to Slack](https://slack.com/oauth/authorize?scope=users:read,users:read.email,commands,chat:write:bot,chat:write:user,channels:read,channels:history,files:write:user,channels:write,bot&client_id=23850726983.39760486257).

  Step 2:  Tell the Wordhop bot about your bot.

  Step 3:  Get your API Key and a Client Key.

  Step 4:  Return to this screen and enter your keys in the form above.

  Step 5:  Send your bot an intent you know it won't understand and you should receive an alert in Slack. 

  Step 6: Add custom triggers to alert you in slack when a user may need assistance, such as when a user says \`human\'. See example below:

  \`\`\`js
  bp.hear({ platform: 'slack', type: 'message', text: 'human' }, (event, next) => {
    bp.events.emit('assistanceRequested', event)
  })
  \`\`\`
  `
}

export default class WordhopModule extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loading: true,
	  'apiKey': '',
	  'clientKey': '',
      hashState: null
    }
  }

  componentDidMount() {
    this.fetchConfig()
  }

  getAxios = () => this.props.bp.axios
  mApi = (method, url, body) => this.getAxios()[method]('/api/botpress-wordhop' + url, body)
  mApiGet = (url, body) => this.mApi('get', url, body)
  mApiPost = (url, body) => this.mApi('post', url, body)

  fetchConfig = () => {
    return this.mApiGet('/config').then(({data}) => {
      this.setState({
        apiKey: data.apiKey,
        clientKey: data.clientKey,
        loading: false
      })

      setImmediate(() => {
        this.setState({
          hashState: this.getHashState()
        })
      })
    })
  }

  

  getHashState = () => {
    const values = _.omit(this.state, ['loading', 'hashState'])
    return _.join(_.toArray(values), '_')
  }

  getParameterByName = (name) => {
    const url = window.location.href
    name = name.replace(/[\[\]]/g, "\\$&")
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, " "))
  }

  handleChange = event => {
    const { name, value } = event.target

    this.setState({
      [name]: value
    })
  }

  handleSaveConfig = () => {
    this.mApiPost('/config', {
      apiKey: this.state.apiKey,
      clientKey: this.state.clientKey
    })
    .then(({data}) => {
      this.fetchConfig()
    })
    .catch(err => {
      console.log(err)
    })
  }

handleReset = () => {
  this.setState({
    apiKey: null,
    clientKey: null
  })

  setImmediate(() => {
    this.setState({ hashState: this.getHashState()})
    this.handleSaveConfig()
  })
}

  // ----- render functions -----

  renderHeader = title => (
    <div className={style.header}>
      <h4>{title}</h4>
      {this.renderSaveButton()}
    </div>
  )


  renderDocumentationHeader = title => (
    <div className={style.header}>
      <h4>{title}</h4>
    </div>
  )

  renderLabel = label => {
    return (
      <Col componentClass={ControlLabel} sm={3}>
        {label}
      </Col>
    )
  }

  renderInput = (label, name, props = {}) => (
    <FormGroup>
      {this.renderLabel(label)}
      <Col sm={7}>
        <FormControl name={name} {...props}
          value={this.state[name]}
          onChange={this.handleChange} />
      </Col>
    </FormGroup>
  )

  renderTextInput = (label, name, props = {}) => this.renderInput(label, name, {
    type: 'text', ...props
  })

  renderTextAreaInput = (label, name, props = {}) => {
    return this.renderInput(label, name, {
      componentClass: 'textarea',
      rows: 2,
      ...props
    })
  }

  withNoLabel = (element) => (
    <FormGroup >
      <Col smOffset={3} sm={7}>
        {element}
      </Col>
    </FormGroup>
  )

  renderBtn = (label, handler) => (
    <Button className={style.formButton} onClick={handler}>{label}</Button>
  )

  renderLinkButton = (label, link, handler) => (
    <a href={link}>
      <Button className={style.formButton} onClick={handler}>
        {label}
      </Button>
    </a>
  )


  renderSaveButton = () => {
    let opacity = 0
    if (this.state.hashState && this.state.hashState !== this.getHashState()) {
      opacity = 1
    }

    return <Button
        className={style.formButton}
        style={{opacity: opacity}}
        onClick={this.handleSaveConfig}>
          Save
      </Button>
  }

  renderConfigSection = () => {
    return (
      <div className={style.section}>
        {this.renderHeader('Configuration')}
    
        {this.renderTextInput('API Key', 'apiKey', {
          placeholder: 'Paste your api key here...',
        })}

        {this.renderTextInput('Client Key', 'clientKey', {
          placeholder: 'Paste your client id here...'
        })} 
        
      </div>
    )
  }

  renderDocumentationSection = () => {
    return (
      <div className={style.section}>
        {this.renderDocumentationHeader('Documentation')}
    
        {this.renderExplication()}
        
      </div>
    )
  }

  renderExplication() {

    return (
      <Row className={style.documentation}>
        <Col sm={12}>
          <Markdown source={documentation.default} />
        </Col>
      </Row>
    )
  }


  render() {
    if (this.state.loading) return null

    return <Col md={10} mdOffset={1}>
        <Form horizontal>
          {this.renderConfigSection()}
        </Form>
        {this.renderDocumentationSection()}
      </Col>
  }
}
