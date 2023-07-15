const { google } = require('googleapis')
const fs = require('fs')

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.split(
  String.raw`\n`
).join('\n')
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

const getEvents = async (
  maxResult = 1000,
  timeMin = new Date().toISOString(),
  timeMax
) => {
  const result = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin,
    timeMax,
    maxResults: Math.min(maxResult, 1000),
    singleEvents: true,
    orderBy: 'startTime'
  })
  return result.data.items
}

const auth = new google.auth.GoogleAuth({
  keyFile: './key.json',
  scopes: 'https://www.googleapis.com/auth/calendar'
})

const createEvent = async (event) => {
  const result = await auth.getClient().then((a) => {
    return calendar.events.insert({
      auth: a,
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event
    })
  })

  return result.data
}

const clearEvents = async (timeMin = undefined, maxResults = 1000) => {
  try {
    await auth.getClient().then(async (a) => {
      const events = await calendar.events.list({
        calendarId: GOOGLE_CALENDAR_ID,
        singleEvents: false,
        timeMin,
        maxResults
      })

      events.data.items.forEach((event, idx) => {
        setTimeout(() => {
          calendar.events.delete(
            {
              auth: a,
              calendarId: GOOGLE_CALENDAR_ID,
              eventId: event.id
            },
            (err, res) => {
              if (err) {
                console.log('Error: ', err)
                return
              }
              console.log(
                `Deleted ${Math.floor(
                  ((idx + 1) / events.data.items.length) * 100
                )}%`
              )
            }
          )
        }, idx * 1000)
      })
    })
    return 'Clear successful'
  } catch (err) {
    console.log(err)
    throw err
  }
}

module.exports = {
  getEvents,
  createEvent,
  clearEvents
}
