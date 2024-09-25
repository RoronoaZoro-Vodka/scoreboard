export const genQrcode = (roomNum: number, callback: any) => {
  wx.cloud.callFunction({
    // 云函数名称
    name: 'wxacode',
    data: {
      page: 'pages/room/room',
      query: 'roomNum=' + roomNum
    },
    success: function (res: any) {
      callback(res.result)
    },
    fail: console.error
  })
}