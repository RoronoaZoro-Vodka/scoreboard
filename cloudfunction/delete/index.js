// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
const _ = db.command
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const table = event.table
  const query = event.query || {}
  const me = event.me || false
  if (me) {
    query['userId'] = wxContext.OPENID
  }
  for (const key in query) {
    if (Object.hasOwnProperty.call(query, key)) {
      const element = query[key];
      if (element.constructor === Array) {
        query[key] = _.in(element)
      }
    }
  }
  try {
    return await db.runTransaction(async transaction => {
      const update = await transaction.collection(table).where(query).remove()
      return update
    })
  } catch(err) {
    console.error(`transaction error`, e)
    return false;
  }
}