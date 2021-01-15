'use strict'

import dotenv from 'dotenv'
import express from 'express'
import { Client, ClientConfig, MiddlewareConfig, TextMessage, WebhookEvent, middleware } from '@line/bot-sdk'
import { dialogManager } from './controllers/dialog'
import { userManager } from './controllers/user'

dotenv.config()

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
} as ClientConfig

console.log(config)

// create LINE SDK client
const client = new Client(config)

// create Express app
// about Express itself: https://expressjs.com/
const app = express()

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', middleware(config as MiddlewareConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err)
      res.status(500).end()
    })
})

// event handler
function handleEvent (event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null)
  }
  console.log(event)
  if (!userManager.isNewUser(event.source)) {
    userManager.createNewUser(event)
  }
  const text = dialogManager.executeCommands(event.message)
  // create a echoing text message
  const echo = { type: 'text', text } as TextMessage

  // use reply API
  return client.replyMessage(event.replyToken, echo)
}

// listen on port
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`listening on ${port}`)
})
