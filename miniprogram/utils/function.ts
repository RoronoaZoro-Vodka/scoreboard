export const func = {
  query: (table:string, query:any, me?:boolean) => {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'query',
        data: {
          table: table,
          query: query,
          me: me || false
        },
        success: function (res:any) {
          resolve(res.result)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  },
  update: (table:string, query:any, set:any, me?:boolean):any => {
    return new Promise((resolve, reject):any => {
      wx.cloud.callFunction({
        name: 'update',
        data: {
          table: table,
          query: query,
          set:set,
          me: me || false
        },
        success: function (res:any) {
          resolve(res.result)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  },
  add:(table:string, data:any, me?:boolean):any => {
    data['createTime'] = new Date().getTime()
    return new Promise((resolve, reject):any => {
      wx.cloud.callFunction({
        name: 'insert',
        data: {
          table: table,
          data: data,
          me: me || false
        },
        success: function (res:any) {
          resolve(res.result)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }
}