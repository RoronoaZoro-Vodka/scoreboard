// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false
})
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const sender = event.sender
  const receiver = event.receiver
  const score = event.score
  try {
    await db.runTransaction(async transaction => {
      await transaction.collection('tally_room_users').doc(receiver._id).update({
        data: {
          score: _.inc(score)
        }
      })
      await transaction.collection('tally_room_users').doc(sender._id).update({
        data: {
          score: _.inc(-score)
        }
      })
    })
    return true;
  } catch(e) {
    console.error(`transaction error`, e)
    return false;
  }
}