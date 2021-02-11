const request = require('request');
const ips = require('./iplist');
const filejson = require('jsonfile');
const axios = require('axios');
const headers = {
  "User_Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1",
  "Referer" : "http://www.xicidaili.com/nn/1"
}
module.exports.step = ips.length;
const failIP = {}

const ipUrl = 'http://gev.qydailiip.com/api/?apikey=c8b050921561db62b726ccc5cf082bb6a0868671&num=50&type=json&line=Mac&proxy_type=secret';

let usdTime;
let ipList = [];
async function getIpList() {
  if ((usdTime && new Date() - usdTime > 1000 * 100) || !usdTime) {
    const res = await axios.get(ipUrl);
    console.log(res, 'res');
    ipList = res.data;
    usdTime = +new Date();
  }
  return ipList;
}

function doRequest (targetUrl, proxyIP, resolve, retryCounter = 0) {
  request({
    url: targetUrl,
    method: 'GET',
    proxy: `http://${proxyIP}`
  }, async function(err, response, body) {
    if (!err && response.statusCode === 200) {
      console.log('statusCode', response.statusCode) // '150',
      console.log('请求成功', proxyIP);
      resolve({
        success: true,
        url: targetUrl,
        ip: proxyIP,
        data: body + ''
      });
    } else {
      if (retryCounter < 4) { // 重试
        await delay(30);
        doRequest(targetUrl, proxyIP, resolve, retryCounter++);
      } else {
        console.log('出错ip', proxyIP, '\n', err, '\n', response.statusCode);
        resolve({
          success: false,
          url: targetUrl
        });
      }
    }
  });
}

async function requestTx (targetUrl, proxyIP) {
  return new Promise((resolve => {
    doRequest(targetUrl, proxyIP, resolve)
  }));
}

// getProxyList().then(console.log, console.error);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function requestMultiUrls(urls) {
  const iplist = ips;
  console.log('ip length', iplist.length);
  let promies = [];
  let len = urls.length;
  let counter = 0;
  for (let i = 0; i < len; i++) {
    let ip = iplist[i];
    let url = urls[i];
    let p = new Promise(async (resolve, reject) => {
      await delay(i * 60);
      var isBack = false;
      var isTimeout = false;
      var timer = setTimeout(()=>{
        if (isBack) {
          return;
        }
        console.log('ip 超时了', ip);
        if (!failIP[ip]) {
          failIP[ip] = 1;
        } else {
          failIP[ip]++;
        }
        timer = null;
        resolve({
          success: false,
          url: url
        });
        isTimeout = true;
      }, 10000);

      const data = await requestTx(url, ip);
      isBack = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (isTimeout) {
        return;
      }
      console.log('数据回来了', ++counter, 'len',len);
      resolve(data);
    });
    promies.push(p);
  }
  try {
    const res = await Promise.all(promies);
    var sussCount = 0;
    res.forEach((item)=>{
      if (item.success) {
        sussCount++;
      }
    })
    const failIPArray = [];
    for (let ip in failIP) {
      if (failIP[ip] > 30) {
        failIPArray.push(ip);
      }
    }
    console.log('超时超过30次的ip列表', failIPArray);
    var per = sussCount / res.length;
    console.log('成功率：' + per * 100 + '%')
    filejson.writeFile('./ipFail.json', failIPArray);
    filejson.writeFile('./ip.json', res.filter(i=>i.success).map(i=>i.ip))
    return res
  }catch (e) {
    console.log('有错误', e);
  }
}
module.exports.requestMultiUrls = requestMultiUrls;
