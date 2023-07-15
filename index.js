require('dotenv').config()
const express = require('express')
const { google } = require('googleapis')
const fs = require('fs')
const { getEvents, createEvent } = require('./googleCalendar')

const app = express()

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID

const jwtClient = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  SCOPES
)

const calendar = google.calendar({
  version: 'v3',
  project: GOOGLE_PROJECT_NUMBER,
  auth: jwtClient
})

app.get('/events', (req, res) => {
  getEvents(10)
    .then((events) => {
      if (events.length) {
        res.send(JSON.stringify({ events: events }))
      } else {
        res.send(JSON.stringify({ message: 'No upcoming events found.' }))
      }
    })
    .catch((error) => {
      res.send(JSON.stringify({ error: error }))
    })
})

app.get('/createEvent', (req, res) => {
  var event = {
    summary: 'My first event!',
    location: 'Hyderabad,India',
    description: 'First event with nodeJS!',
    start: {
      dateTime: new Date().toISOString()
    },
    end: {
      dateTime: new Date().toISOString()
    },
    attendees: [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 }
      ]
    }
  }

  createEvent(event)
    .then((rs) => {
      console.log(rs)
      res.jsonp(rs)
    })
    .catch((err) => {
      console.log(err)
      res.jsonp(err)
    })
})

app.listen(3000, () => console.log(`App listening on port 3000!`))

// This code is contributed by Yashi Shukla
