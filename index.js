require('dotenv').config()
const express = require('express')
const { google } = require('googleapis')
const fs = require('fs')
const { getEvents, createEvent, clearEvents } = require('./googleCalendar')
const { getTaskListInfo, getTaskListData } = require('./notion')

const app = express()

app.get('/events', (req, res) => {
  getEvents()
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

app.get('/taskListInfo', (req, res) => {
  getTaskListInfo().then((rs) => {
    console.log(rs)
    res.jsonp(rs)
  })
})

app.get('/taskList', (req, res) => {
  getTaskListData().then((rs) => {
    console.log(rs)
    res.jsonp(rs)
  })
})

app.get('/clearCalendar', async (req, res) => {
  try {
    await clearEvents()

    res.send(JSON.stringify({ message: 'Clear successful' }))
  } catch (err) {
    console.log(err)
    res.send(JSON.stringify({ error: err }))
  }
})

app.get('/syncToCalendar', async (req, res) => {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  // const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  try {
    // Cần update lại logic clear event, chỉ clear và update những event có sự thay đổi
    await clearEvents(oneDayAgo.toISOString())
    const tasks = await getTaskListData()
    const events = await getEvents(1000, oneDayAgo.toISOString())
    const eventTitles = events.map((event) => event.summary)
    var countErr = 0

    const newTasks = tasks.filter(
      (task) =>
        !eventTitles.includes(task.properties.Name.title[0].text?.content) &&
        task.properties['Due date'].date?.start
    )
    const newEvents = newTasks.map((task) => {
      const isAllDay = !task.properties['Due date'].date?.start.includes('T')
      return {
        summary: task.properties.Name.title[0].text?.content,
        start: {
          date: isAllDay ? task.properties['Due date'].date?.start : undefined,
          dateTime: !isAllDay
            ? task.properties['Due date'].date?.start
            : undefined
        },
        end: {
          date: isAllDay
            ? task.properties['Due date'].date?.end ||
              task.properties['Due date'].date?.start
            : undefined,
          dateTime: !isAllDay
            ? task.properties['Due date'].date?.end ||
              task.properties['Due date'].date?.start
            : undefined
        },
        description: `
Link: ${task.url}
Task ID: ${task.properties.ID.unique_id.prefix}${
          task.properties.ID.unique_id.number
        }
Priority: ${task.properties.Priority?.select?.name}
Type: ${task.properties.Type?.select?.name}
Tags: ${task.properties.Tag.multi_select?.map((tag) => tag?.name).join(', ')}
        `,
        attendees: [],
        reminders: {
          useDefault: true
          // overrides: [
          //   { method: 'email', minutes: 24 * 60 },
          //   { method: 'popup', minutes: 10 }
          // ]
        }
      }
    })

    newEvents.forEach((event, idx) => {
      setTimeout(async () => {
        createEvent(event)
          .then((rs) => {
            console.log(
              `Sync ${Math.floor(
                ((idx + 1 - countErr) / newEvents.length) * 100
              )}% done`
            )
          })
          .catch((err) => {
            countErr += 1
            console.log(err)
          })
      }, idx * 1000)
    })

    res.send(JSON.stringify({ message: 'Sync successful' }))
  } catch (err) {
    console.log(err)
    res.send(JSON.stringify({ error: err }))
  }
})

app.listen(3000, () => console.log(`App listening on port 3000!`))

// This code is contributed by Yashi Shukla
