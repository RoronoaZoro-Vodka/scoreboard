export const time = {
  formatUnit: (timestamp:number) => {
    // 换算s
    const second = timestamp/1000
    if (second < 60) {
      return `${parseInt(second + '')}秒`
    }
    const min = second / 60
    if (min < 60) {
      return `${parseInt(min + '')}分钟${parseInt((second%60) + '')}秒`
    }
    const hour = min / 60
    if (hour < 24) {
      return `${parseInt(hour + '')}小时${parseInt((min%24) + '')}分钟`
    }
    return `${parseInt((hour/24) + '')}天${parseInt((hour%24) + '')}小时`
  }
}