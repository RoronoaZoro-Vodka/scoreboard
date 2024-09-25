import { func } from "../../utils/function"
import { formatTime } from "../../utils/util"

// pages/history/history.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    rooms: [],
    activeName: '',
    myUserId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    wx.showLoading({
      title: '加载'
    })
    const _this = this
    // 查询已结算的房间
    func.query('tally_room_users', {state: 2}, true).then((userRooms:any) => {
      const nums:any = []
      for (let i = 0; i < userRooms.length; i++) {
        nums.push(userRooms[i].roomNum)
      }
      if (userRooms.length > 0) {
        _this.setData({
          myUserId: userRooms[0].userId
        })
      }
      func.query('tally_room_main', {roomNum: nums}).then((rooms:any) => {
        rooms.forEach((element:any) => {
          const lastUpdateTime = element.lastUpdateTime
          const date = new Date(lastUpdateTime)
          element.lastUpdateTimeLabel = formatTime(date)
          element.loading = true
          const roomScore = userRooms.filter((item:any) => item.roomNum == element.roomNum)[0]
          element['iScore'] = roomScore.score
        });
        rooms.sort((l:any, r:any) => {
          return l.lastUpdateTime - r.lastUpdateTime
        })
        _this.setData({
          rooms: rooms
        })
        wx.hideLoading()
      })
    })
  },
  onCollapseChange(event:any) {
    this.setData({
      activeName: event.detail,
    });
    const roomNumber = Number(event.detail)
    const room:any = this.data.rooms.filter((item:any) => item.roomNum == roomNumber)[0]
    if (room.loading) {
      const _this = this
      func.query('tally_room_users', {roomNum: roomNumber}).then((roomUsers:any) => {
        const userIds:any = []
        roomUsers.forEach((element:any) => {
          userIds.push(element.userId)
        });
        func.query('sys_user', {userId: userIds}).then((users:any) => {
          users.forEach((element:any) => {
            const roomUser = roomUsers.filter((item:any) => item.userId == element.userId)[0]
            element['score'] = roomUser.score
            if (element.userId == _this.data.myUserId) {
              element['me'] = true
            } else {
              element['me'] = false
            }
          });
          const roomTea = roomUsers.filter((item:any) => item.userId == 'room_tea')[0]
          users.push({
            userId: 'room_tea',
            userName: '茶水费',
            _id: new Date().getTime() + '',
            score: roomTea.score
          })
          const rooms = _this.data.rooms
          rooms.forEach((element:any) => {
            if (element.roomNum == roomNumber) {
              element['users'] = users
              element['loading'] = false
            }
          });
          _this.setData({
            rooms: rooms
          })
        })
      })
    }
  },
  onShareAppMessage() {}
})