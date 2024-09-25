import { func } from "../../utils/function";
import Dialog from '@vant/weapp/dialog/dialog';

// pages/index/index.js
getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isAddRoom: false,
    isLog: false,
    info: {
      userName: '',
      defaultAvatar: true,
      defaultName: true
    },
    tongji: {},
    instructions: false,
    rooms: [],
    loading: true,
    code: '',
    inRoom: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
  },
  setAddRoomJia() {
    if (!!this.data.info.defaultAvatar || !!this.data.info.defaultName) {
      // 为方便区分，请点击头像和昵称替换默认信息
      Dialog.alert({
        message: '为方便区分，请点击头像和昵称替换默认信息',
      }).then(() => {
        // on close
      });
      return
    }
    wx.scanCode({
      onlyFromCamera: false,// 只允许从相机扫码
      success(res){
        const text:any = res.result
        const roomNum = Number(text.replace('room:', ''))
        // 扫码成功后  在此处理接下来的逻辑
        wx.cloud.callFunction({
          // 云函数名称
          name: 'joinRoom',
          data: {
            roomNum: roomNum
          },
          success: function (res: any) {
            if (res.result.roomNum < 0) {
              wx.showToast({
                title: '房间不存在',
                duration: 2000
              })
            } else {
              wx.redirectTo({
                url: '/pages/room/room?id=' + res.result.roomNum,
              })
            }
          },
          fail: console.error
        })
      }
    })
  },
  setAddRoom() {
    if (!!this.data.info.defaultAvatar || !!this.data.info.defaultName) {
      // 为方便区分，请点击头像和昵称替换默认信息
      Dialog.alert({
        message: '为方便区分，请点击头像和昵称替换默认信息',
      }).then(() => {
        // on close
      });
      return
    }
    wx.showModal({
      title: '提示',
      content: '确定要创建一个新的房间吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title:"创建中"
          })
          wx.cloud.callFunction({
            name: 'createRoom',
            success: function (res:any) {
              wx.hideLoading()
              wx.redirectTo({
                url: '/pages/room/room?id=' + res.result.roomNum,
              })
            },
            fail: console.error
          })
          // 创建房间并且打开这个页面喽
        }
      }
    });
  },
  onCloseRoom() {
    this.setData({
      isAddRoom: false
    })
  },
  onClose2() {
    this.setData({
      isLog: false
    })
  },
  myHisRoom() {
    wx.redirectTo({
      url: '/pages/history/history',
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    wx.showLoading({
      title: ""
    })
    const _this = this
    wx.cloud.callFunction({
      // 云函数名称
      name: 'login',
      success: function (res:any) {
        _this.initFun(res.result)
      },
      fail: console.error
    })
  },
  isXyiClose() {
    this.setData({
      instructions: false
    })
  },
  instructions() {
    this.setData({
      instructions: true
    })
  },
  initFun(user: any) {
    this.setData({
      info: user
    })
    // 判断当前用户是否有未结算房间
    const _this = this
    func.query('tally_room_users', {state: 1}, true).then((room:any) => {
      if (room?.length == 0) {
        // 提示创建/加入房间
        _this.setData({
          inRoom: false
        })
        wx.cloud.callFunction({
          // 云函数名称
          name: 'getUserTotalScore',
          success: function (res:any) {
            _this.setData({
              tongji: res.result
            })
          },
          fail: console.error
        })
        wx.hideLoading()
      } else {
        // 转入所在房间页面
        wx.redirectTo({
          url: '/pages/room/room?id=' + room[0].roomNum,
        })
        wx.hideLoading()
      }
    })
  },

    onChooseAvatar(e: any) {
    let { avatarUrl } = e.detail
    let _imgbase64 = 'data:image/png;base64,' + wx.getFileSystemManager().readFileSync(avatarUrl, "base64")
    const _this = this
    func.update('sys_user', {}, {avatarUrl: _imgbase64, defaultAvatar: false}, true).then((res:any) => {
      if (!!res) {
        _this.setData({
          'info.avatarUrl': _imgbase64,
          'info.defaultAvatar': false
        })
      }
    })
  },
  onInputChange(e: any) {
    const name = e.detail.value
    const _this = this
    if (name != this.data.info.userName) {
      func.update('sys_user', {}, {userName: name, defaultName: false}, true).then((res:any) => {
        if (!!res) {
          _this.setData({
            'info.userName': name,
            'info.defaultName': false
          })
        }
      })
    }
  },
  onShareAppMessage() {}
})