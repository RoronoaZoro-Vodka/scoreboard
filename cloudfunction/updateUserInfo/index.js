// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const updateData = { }
  if (!!event.userName) {
    updateData['userName'] = event.userName
    updateData['defaultName'] = false
  }
  if (!!event.avatarUrl) {
    updateData['avatarUrl'] = event.avatarUrl
    updateData['defaultAvatar'] = false
  }
  await db.collection('sys_user').where({
    userId: wxContext.OPENID
  }).update({
    data: updateData
  })
  return 1
}