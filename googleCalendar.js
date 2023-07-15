require('dotenv').config()
const { google } = require('googleapis')
const fs = require('fs')

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

const getEvents = async (maxResult) => {
  const result = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin: new Date().toISOString(),
    maxResults: maxResult,
    singleEvents: true,
    orderBy: 'startTime'
  })
  return result.data.items
}

const createEvent = async (event) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: './key.json',
    scopes: 'https://www.googleapis.com/auth/calendar'
  })

  const result = await auth.getClient().then((a) => {
    return calendar.events.insert({
      auth: a,
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event
    })
  })

  return result.data
}

module.exports = {
  getEvents,
  createEvent
}
