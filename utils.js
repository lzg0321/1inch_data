const {apikey} = require('./const')
const axios = require('axios')
const request = require('request')
const fs = require('fs')
const jsonfile = require('jsonfile')
const _ = require('lodash')
async function getHistoryByAddress(address, endBolck = 11796458){
  const file = "./data/" + address + ".json";
  let fileJson = []
  let emptyCount = 0;
  if (fs.existsSync(file)) {
    fileJson = await jsonfile.readFileSync(file);
    console.log('fileJson', fileJson.length);
    // console.log(fileJson[fileJson.length - 1].blockNumber);
    if (fileJson.length > 0) {
      endBolck = fileJson[fileJson.length - 1].blockNumber
    }
  }
  let allList =[...fileJson];
  const interval = 1000;
  // 第一次请求  每次需要根据返回结果请求
  let startBlock = endBolck - interval;
// 当返回的数值小于等于1W时，则停止请求
  let url_by_block, data, newHis
  let hisLength = 10000
  while(emptyCount < 50000){
    async function call(s,e) {
      url_by_block = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${s}&endblock=${e}&sort=desc&apikey=${apikey}`
      console.log('url_by_block', url_by_block)
      const res = await axios.get(url_by_block).catch((err) => {
        console.log('err', err)
        return {data:[]}
      });
      return res.data;
    }
    let res = await Promise.all([
      call(endBolck - interval, endBolck),
      call(endBolck - interval * 2, endBolck - interval - 1),
      call(endBolck - interval * 3, endBolck - interval * 2 - 1),
      call(endBolck - interval * 4, endBolck - interval * 3 - 1),
    ])
    res = res.map(r=>r.result);
    const historyList = [...res[0], ...res[1], ...res[2], ...res[3]];
    // const data = res.data;
    // console.log('data',data);
    // let historyList = data.result || []; //test_his_data.result
    historyList.map(item=>{
      delete item.input;
    })
    hisLength = historyList.length;
    if (hisLength > 0) {
      emptyCount = 0;
    } else {
      emptyCount += interval * 3;
    }
    console.log('emptyCount', emptyCount);
    console.log('hisLength', hisLength);

    if(hisLength > 0){
      allList.push(...historyList);
    }
    // _.uniqWith(allList, _.isEqual)
    // let lastBlockNumber = historyList[historyList.length - 1].blockNumber;
    endBolck = endBolck - interval * 4 - 1;
    // startBlock -= interval;
    console.log('allList', allList.length)
    console.log('percent', 100 * allList.length / 349471 + '%')
    jsonfile.writeFile(file, allList,{ }, function (err) {
      if (err) {
        console.error(err);
      }
    })
  }
  // console.log('allList',allList.length);
  // fs.writeFileSync("./data/" + address + ".json", JSON.stringify(allList));
  return allList
}

async function unique(address) {
  const file = "./data/" + address + ".json";
  const fileUnique = "./data/" + address + "_unique.json";
  let fileJson = await jsonfile.readFileSync(file);
  console.log('fileJson before', fileJson.length);
  fileJson = fileJson.filter(item=>item.hash);
  const uniqueList =  _.uniqBy(fileJson, 'hash');
  console.log('fileJson after', uniqueList.length);
  jsonfile.writeFile(fileUnique, uniqueList,{ }, function (err) {
    if (err) {
      console.error(err);
    }
  })
}
module.exports.getHistoryByAddress = getHistoryByAddress;
module.exports.unique = unique;
