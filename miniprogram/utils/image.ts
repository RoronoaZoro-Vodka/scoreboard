export const image = {
  url2base64: (url:string, callback:Function) => {
    wx.request({
      url:url,
      responseType: 'arraybuffer', //最关键的参数，设置返回的数据格式为arraybuffer
      success:res=>{
	      //把arraybuffer转成base64
            let base64 = wx.arrayBufferToBase64(res.data); 
            //不加上这串字符，在页面无法显示的哦
            base64　= 'data:image/jpeg;base64,' + base64　
            callback(base64)
          }
    })
  }
}