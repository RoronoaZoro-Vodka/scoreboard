// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const data = await db.collection('tally_room_users').where({
    roomNum: _.eq(Number(event.roomNum)),
    state: 1
  }).get()
  const users = data.data || []
  const result = [{
    userId: 'room_tea',
    userName: '茶水费',
    avatarUrl:'https://7363-scoreboard-0gpkledv6793d20f-1328527080.tcb.qcloud.la/a.png?sign=94aa546f19b19c6cc80e4b0f245c748a&t=1723107488'
  }]
  for (let i = 0; i < users.length;i++) {
    const userId = users[i].userId
    if (userId=='room_tea') {
      result[0]['_id'] = users[i]._id
      result[0]['score'] = users[i].score
      continue
    }
    const response = await db.collection('sys_user').where({
      userId: userId
    }).get()
    const item = response.data[0]
    item._id = users[i]._id
    item.roomNum = users[i].roomNum
    item['score'] = users[i].score
    if (item.userId == wxContext.OPENID) {
      item['me'] = true
    } else {
      item['me'] = false
    }
    result.push(item)
  }
  return result
}