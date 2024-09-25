// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let win = await db.collection('tally_room_users').where({
    userId: wxContext.OPENID,
    score: _.gt(0)
  }).count()
  win = win.total || 0
  let lost = await db.collection('tally_room_users').where({
    userId: wxContext.OPENID,
    score: _.lt(0)
  }).count()
  lost = lost.total || 0

  let eq = await db.collection('tally_room_users').where({
    userId: wxContext.OPENID,
    score: _.eq(0)
  }).count()
  eq = eq.total || 0

  let total = await db.collection('tally_room_users').where({
    userId: wxContext.OPENID,
  }).count()
  total = total.total || 0
  return {
    win: win,
    lost: lost,
    eq: eq,
    winRate: total == win ? 100 : ((win/total) * 100).toFixed(2)
  }
}