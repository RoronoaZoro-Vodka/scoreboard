// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.cloud.init({
      env: 'scoreboard-0gpkledv6793d20f', //填上你的云开发环境id
      traceUser: true,
    })

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.setStorageSync('wxId', res.code)
      },
    })
  }
})