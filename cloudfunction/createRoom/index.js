// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false
})

const roomQrCode = async (roomNum) => {
  const result = await cloud.openapi.wxacode.getUnlimited({
    "page": 'pages/room/room',
    "scene": 'roomNum=' + roomNum,
    "checkPath": true,
    "envVersion": 'release'
  })
  // 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: 'roomQrcode/' + roomNum + '.jpg',
    fileContent: result.buffer
  });
  if (!uploadResult.fileID) {
    //上传失败，返回错误信息
    return '';
  }
  // 获取图片临时路径
  let getURLReault = await cloud.getTempFileURL({
    fileList: [uploadResult.fileID]
  });
  let fileObj = getURLReault.fileList[0];
  fileObj.fromCache = false;
  return fileObj.tempFileURL
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const room = await db.runTransaction(async transaction => {
    let count = await transaction.collection('tally_room_main').count()
    count = count.total || 0
    const room = {
      roomNum: 10000 + count,
      roomStatus: 1,
      createTime: new Date().getTime()
    }
    room['roomQrcode'] = await roomQrCode(room.roomNum)
    await transaction.collection('tally_room_main').add({
      data: room
    })
    await transaction.collection('tally_room_users').add({
      data: {
        roomNum: room.roomNum,
        userId: wxContext.OPENID,
        state: 1,
        score: 0
      }
    })
    await transaction.collection('tally_room_users').add({
      data: {
        roomNum: room.roomNum,
        userId: 'room_tea',
        state: 1,
        score: 0
      }
    })
    return room
  })
  return room
}