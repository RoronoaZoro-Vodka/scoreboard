// pages/room.ts
import { func } from '../../utils/function'
import { genQrcode } from '../../utils/qrcode'
import { time } from '../../utils/time'
import { formatTime } from '../../utils/util'


Page({
  /**
   * 页面的初始数据
   */
  data: {
    roomNum: 0,
    roomUsers: [] as any[],
    gridRow: [] as any[],
    qrcode: '',
    qrcodeInvite: false,
    watcher: null as any,
    showPay: false,
    payData: {
      sender: {},
      receiver: {},
      score: 0
    } as any,
    roomInfo: {} as any,
    survival: '',
    roomWatcher: null as any,
    roomLogs: [] as any[],
    logActive: '',
    roomLogWatcher: null as any,
    sms: ''
  },
  onHide() {
    if (!!this.data.watcher) {
      this.data.watcher.close()
    }
    if (!!this.data.roomWatcher) {
      this.data.roomWatcher.close()
    }
    if (!!this.data.roomLogWatcher) {
      this.data.roomLogWatcher.close()
    }
  },
  onShow() {
    if (this.data.roomNum) {
      wx.showLoading({
        title: '刷新'
      })
      this.loadRoomUser(this.data.roomNum)
      if (!this.data.watcher) {
        this.watchScore()
      }
    }
  },
  joinRoom(roomNum:number, callback:Function) {
    wx.cloud.callFunction({
      // 云函数名称
      name: 'login',
      success: function (res:any) {
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
              wx.redirectTo({
                url: '/pages/index/index'
              })
            } else {
              callback()
            }
          },
          fail: console.error
        })
      },
      fail: console.error
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    wx.showLoading({
      title: '刷新'
    })
    let roomNum = 0
    let join = false;
    if (!!options.scene) {
      const scene = decodeURIComponent(options.scene)
      roomNum = Number(scene.replace('roomNum=', ''))
    } else {
      roomNum = Number(options.id)
      join = true
    }
    const _this = this
    setInterval(() => {
      if (!!_this.data.roomInfo.createTime) {
        _this.setData({
          survival: time.formatUnit(new Date().getTime() - _this.data.roomInfo.createTime)
        })
      }
    }, 1050)
    this.setData({
      roomNum: roomNum
    })
    if (!join) {
      this.joinRoom(roomNum, () => {
        func.query('tally_room_main', {
          roomNum: _this.data.roomNum
        }, false).then((res: any) => {
          this.setData({
            roomInfo: res[0]
          })
          wx.setNavigationBarTitle({
            title: "房间：" + res[0].roomNum
          })
          _this.loadRoomUser(_this.data.roomNum)
        })
      })
    } else {
      func.query('tally_room_main', {
        roomNum: _this.data.roomNum
      }, false).then((res: any) => {
        this.setData({
          roomInfo: res[0]
        })
        wx.setNavigationBarTitle({
          title: "房间：" + res[0].roomNum
        })
        _this.loadRoomUser(_this.data.roomNum)
      })
    }
  },
  loadRoomUser(roomNum: number) {
    const _this = this
    wx.cloud.callFunction({
      name: 'getRoomUser',
      data: {
        roomNum: Number(roomNum)
      },
      success: function (res: any) {
        if (res.result.length == 1) {
          // 跳转
          wx.redirectTo({
            url: '/pages/index/index',
          })
          return
        }
        const row = res.result.length%4 > 0 ? parseInt(res.result.length/4 + '') + 1 : parseInt(res.result.length/4 + '')
        const gridRow = []
        for (let i = 0; i < row; i++) {
          const end = i * 4 + 4 > res.result.length ? res.result.length : i * 4 + 4
          gridRow.push(res.result.slice(i*4, end))
        }
        _this.setData({
          'roomUsers': res.result,
          gridRow: gridRow
        })
        _this.loadRoomLogs()
        wx.hideLoading()
      },
      fail: console.error
    })
  },
  addRoomLog(message:string) {
    func.add('tally_room_log', {
      message: message,
      roomNum: this.data.roomNum
    }, true)
  },
  loadRoomLogs() {
    const _this = this
    func.query('tally_room_log', {roomNum: this.data.roomNum}).then((res:any) => {
      res.sort((l:any, r:any) => {
        return r.createTime - l.createTime
      })
      const logs:any[] = []
      res.forEach((log:any) => {
        const count = logs.filter(item => {
          return item.text == log.message && item.desc == formatTime(new Date(log.createTime))
        }).length
        if (count == 0) {
          logs.push({
            text: log.message,
            desc:formatTime(new Date(log.createTime))
          })
        }
      });
      _this.setData({
        roomLogs: logs
      })
    })
  },
  onChangePayScore(e: any) {
    this.setData({
      'payData.score': Number(e.detail)
    })
  },
  me() {
    const match = this.data.roomUsers.filter((item:any) => item.me) || []
    if (match.length > 0) {
      return match[0]
    } else {
      return null
    }
  },
  watchScore() {
    // 监听数据变化
    const db = wx.cloud.database()
    const _this = this
    // 操作记录监听
    const roomLogWatcher = db.collection('tally_room_log').where({
      roomNum: _this.data.roomNum
    }).watch({
      onChange: function(snapshot:any) {
        if (snapshot.type != 'init') {
          _this.loadRoomLogs()
        }
      },
      onError: console.error
    })
    this.setData({
      roomLogWatcher: roomLogWatcher
    })
    // 退房监听
    const roomWatcher = db.collection('tally_room_main').where({
      roomNum: _this.data.roomNum
    }).watch({
      onChange: function(snapshot:any) {
        const changeData = snapshot.docChanges[0]
        const updatedFields = changeData.updatedFields
        if (updatedFields && updatedFields.hasOwnProperty('roomStatus')) {
          const roomStatus = updatedFields['roomStatus']
          if (roomStatus == 3) {
            // 有人发起退房
            const doc = changeData.doc
            const lastUpdateUserName = doc.lastUpdateUserName
            const lastUpdateUserId = doc.lastUpdateUserId
            const me = _this.me()
            if (!!me && lastUpdateUserId != me.userId) {
              wx.showModal({
                title: '退房申请',
                content: `${lastUpdateUserName}发起了退房`,
                success(res) {
                  wx.showLoading({
                    title:'退房中'
                  })
                  if (res.confirm) {
                    _this.confirmLeaveRoom()
                  } else if (res.cancel) {
                    // 取消退房，房间状态回退到1
                    func.update('tally_room_main', {
                      roomNum: _this.data.roomNum
                    }, { roomStatus: 1, lastUpdateUserName: 'system', lastUpdateUserId: 'system' }, false).then((res:any) => {
                      wx.hideLoading()
                    })
                  }
                }
              })
            }
          }
        }
        _this.loadRoomUser(_this.data.roomNum)
      },
      onError: function (err) {
        console.error('the watch closed because of error', err)
      }
    })
    this.setData({
      roomWatcher: roomWatcher
    })
    const watcher = db.collection('tally_room_users').where({
      roomNum: _this.data.roomNum
    }).watch({
      onChange: function (snapshot) {
        const docChanges:any = snapshot.docChanges
        for (let i = 0; i < docChanges.length; i++) {
          const changeData: any = docChanges[i]
          const changeDoc = changeData.doc
          if (changeData.dataType == 'add') {
            const userId = changeDoc.userId
            func.query('sys_user', { userId: userId }).then((res: any) => {
              const userName = res[0].userName
              _this.addRoomLog(`${userName}加入了房间`)
            })
          }
          if (changeData.dataType == 'update') {
            if (changeData.updatedFields.hasOwnProperty('state')) {
              if (changeData.updatedFields['state'] == 2) {
                // 有人离开了
                const userId = changeDoc.userId
                const userName = _this.data.roomUsers.filter((item:any) => item.userId == userId)[0].userName
                _this.addRoomLog(`${userName}离开了房间`)
              } else {
                const userId = changeDoc.userId
                func.query('sys_user', { userId: userId }).then((res: any) => {
                  const userName = res[0].userName
                  _this.addRoomLog(`${userName}回到了房间`)
                })
              }
            }
          }
        }
        _this.loadRoomUser(_this.data.roomNum)
        if (snapshot.docs.length > 0) {
          const leaveBehind = snapshot.docs.filter((item: any) => item.state == 1 && item.userId != 'room_tea').length
          if (leaveBehind == 0) {
            func.update('tally_room_main', { roomNum: _this.data.roomNum }, { roomStatus: 2 })
          }
        }
      },
      onError: function (err) {
        console.error('the watch closed because of error', err)
      }
    })
    this.setData({
      watcher: watcher
    })
  },
  showPayScore(item: any) {
    const user = item.currentTarget.dataset['user']
    const me = this.me()
      this.setData({
        showPay: true,
        'payData.sender': me,
        'payData.receiver': user
      })
  },
  confirmScore() {
    wx.showLoading({
      title: '支付中'
    })
    const _this = this
    wx.cloud.callFunction({
      name: 'incRoomScore',
      data: _this.data.payData,
      success: function (res: any) {
        // 暂不依赖监听（存在延迟），优先更新页面数据
        const sender = _this.data.payData.sender
        const receiver = _this.data.payData.receiver
        const score = _this.data.payData.score
        _this.addRoomLog(`${sender.userName}支付了${score}分给${receiver.userName}`)
        // _this.addRoomLog(`${me.userName}发起了退房`)
        if (res.result) {
          _this.loadRoomUser(_this.data.roomNum)
          _this.setData({
            'payData.score': 0
          })
        }
        wx.hideLoading()
      },
      fail: console.error
    })
  },
  invite() {
    if (!!this.data.roomInfo.roomQrcode) {
      this.setData({
        qrcodeInvite: true
      })
    } else {
      const roomNum = this.data.roomNum
      const _this = this
      genQrcode(roomNum, function (qrcode: any) {
        _this.setData({
          'roomInfo.roomQrcode': qrcode.tempFileURL,
          qrcodeInvite: true
        })
      })
    }
  },
  onInviteClose() {
    this.setData({ qrcodeInvite: false });
  },
  onPayClose() {
    this.setData({ showPay: false });
  },
  leaveRoom() {
    const _this = this
    wx.showModal({
      title: '下桌',
      content: '确定离开房间吗？',
      success(res) {
        wx.showLoading({
          title:'离开中'
        })
        if (res.confirm) {
          _this.confirmLeaveRoom()
        }
      }
    })
  },
  confirmLeaveRoom() {
    const _this = this
    func.update('tally_room_users', {
      roomNum: _this.data.roomNum
    }, { state: 2 }, true).then((res:any) => {
      wx.hideLoading()
      if (res.stats.updated > 0) {
        wx.redirectTo({
          url: '/pages/index/index',
        })
      }
    })
  },
  checkOutRoom() {
    // 退房
    const _this = this
    wx.showModal({
      title: '退房',
      content: '发起退房后你将离开房间，确定发起退房吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title:'退房中'
          })
          const me = _this.me()
          _this.addRoomLog(`${me.userName}发起了退房`)
          func.update('tally_room_main', {
            roomNum: _this.data.roomNum
          }, { roomStatus: 3, lastUpdateUserName: me.userName, lastUpdateUserId: me.userId }, false).then((res:any) => {
            if (!!res) {
              _this.confirmLeaveRoom()
            } else {
              wx.hideLoading()
            }
          })
        }
      }
    })
  },
  onMessageChange(event:any) {
    const message = event.detail
    this.setData({
      sms: message
    })
  },
  sendMessage() {
    const me = this.me()
    if (!!this.data.sms) {
      this.addRoomLog(`${me.userName}说：${this.data.sms}`)
      this.setData({
        sms: ''
      })
    }
  },
  onShareAppMessage() {},
  onChooseAvatar(e: any) {
    let { avatarUrl } = e.detail
    let _imgbase64 = 'data:image/png;base64,' + wx.getFileSystemManager().readFileSync(avatarUrl, "base64")
    const _this = this
    func.update('sys_user', {}, {avatarUrl: _imgbase64, defaultAvatar: false}, true).then((res:any) => {
      if (!!res) {
        _this.loadRoomUser(_this.data.roomNum)
        func.update('tally_room_main', {roomNum: _this.data.roomNum}, {})
      }
    })
  },
  onInputChange(e: any) {
    const name = e.detail.value
    const _this = this
    const me = _this.me()
    if (!!me.defaultName) {
      func.update('sys_user', {}, {userName: name, defaultName: false}, true).then((res:any) => {
        if (!!res) {
          _this.loadRoomUser(_this.data.roomNum)
          func.update('tally_room_main', {roomNum: _this.data.roomNum}, {})
        }
      })
    }
  }
})