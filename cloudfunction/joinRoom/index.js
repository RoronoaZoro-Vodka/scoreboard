// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false
})
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const roomNum = event.roomNum
    const result = await db.runTransaction(async transaction => {
      // 查询房间状态
      const room = await transaction.collection('tally_room_main').where({
        roomNum: roomNum,
        roomStatus: 1
      }).get()
      if (!!room && !!room.data && room.data.length > 0) {
        // 是否在房间已有数据
        let count = await db.collection('tally_room_users').where({
          roomNum: roomNum,
          userId: wxContext.OPENID
        }).count()
        count = count.total || 0
        if (count > 0) {
          await transaction.collection('tally_room_users').where({
            roomNum: roomNum,
            userId: wxContext.OPENID
          }).update({
            data: {
              state: 1
            }
          })
        } else {
          await transaction.collection('tally_room_users').add({
            data: {
              roomNum: roomNum,
              userId: wxContext.OPENID,
              state: 1,
              score: 0
            }
          })
        }
        
        return room.data[0]
      } else {
        return {
          roomNum: -1
        }
      }
    })
    return result
  } catch(e) {
    console.error(`transaction error`, e)
    return {
      roomNum: -1
    }
  }
}