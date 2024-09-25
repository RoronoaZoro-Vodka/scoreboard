// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const table = event.table
  const query = event.query || {}
  const set = event.set
  const me = event.me || false
  if (me) {
    query['userId'] = wxContext.OPENID
  }
  if (!set) {
    return false
  }
  set['lastUpdateUserId'] = wxContext.OPENID
  set['lastUpdateTime'] = new Date().getTime()
  try {
    return await db.runTransaction(async transaction => {
      const update = await transaction.collection(table).where(query).update({
        data: set
      })
      return update
    })
  } catch(err) {
    console.error(`transaction error`, e)
    return false;
  }
}