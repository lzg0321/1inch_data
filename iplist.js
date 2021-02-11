// 下午5点'20',
var duxiang2 = ["120.43.96.22:4245","140.250.91.159:4213","122.240.138.171:4258","117.60.242.35:4253"]


var fail = []


module.exports = [
].concat(duxiang2.filter(i=>!fail.find(j=>i===j)));
