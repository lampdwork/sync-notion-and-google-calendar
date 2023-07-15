const { Client } = require('@notionhq/client')

const notion = new Client({ auth: process.env.NOTION_SECRET_KEY })
const databaseId = process.env.NOTION_DB_ID

const getNotionDBInfo = async (databaseId) => {
  const response = await notion.databases.retrieve({ database_id: databaseId })
  console.log(response)
  return response
}

const getNotionDBData = async (databaseId) => {
  const response = await notion.databases.query({ database_id: databaseId })
  return response.results
}

module.exports = {
  getTaskListInfo: () => getNotionDBInfo(databaseId),
  getTaskListData: () => getNotionDBData(databaseId)
}
