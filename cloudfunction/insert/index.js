// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const table = event.table
  const data = event.data
  const me = event.me || false
  if (!!data) {
    if (me) {
      data['userId'] = wxContext.OPENID
    }
    try {
      return await db.runTransaction(async transaction => {
        const insert = await transaction.collection(table).add({
          data: data
        })
        return insert
      })
    } catch(error) {
      console.error(`transaction error`, error)
      return false
    }
  }
  return false
}