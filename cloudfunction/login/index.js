// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const user = await db.collection('sys_user').where({
    userId: wxContext.OPENID
  }).get()
  // cloud.database()
  if (user.data.length == 0) {
    // 新增用户
    let count = await db.collection('sys_user').count()
    count = count.total || 0
    const initUser = {
      userId: wxContext.OPENID,
      userName: '微信用户' + (count + 1),
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      defaultName: true,
      defaultAvatar: true
    }
    await db.collection('sys_user').add({
      data: initUser
    })
    return initUser
  } else {
    return user.data[0]
  }
}