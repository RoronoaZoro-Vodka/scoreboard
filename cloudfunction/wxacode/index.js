// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const page = event.page
  const query = event.query
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      "page": page,
      "scene": query,
      "checkPath": true,
      "envVersion": 'release'
    })
    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: 'qr/' + query.replace('roomNum=', '') + '.jpg',
      fileContent: result.buffer
    });
    if (!uploadResult.fileID) {
      //上传失败，返回错误信息
      return uploadResult;
    }
    // 获取图片临时路径
    let getURLReault = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    });
    let fileObj = getURLReault.fileList[0];
    fileObj.fromCache = false;
    return fileObj
  } catch (err) {
    return err
  }
}