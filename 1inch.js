const Crawler =  require('crawler')
const jsonfile = require('jsonfile')
const cheerio = require('cheerio')
const axios = require('axios')
const file = './1inch.json';
const fs = require('fs');
const {getHistoryByAddress, unique} = require('./utils')
const { requestMultiUrls, step } = require('./proxy');
const {insertTx, findLatest, findErrorRecords, updateOne} = require('./db');

function getC(options = {}) {
  var crawler = new Crawler({
    maxConnections : 10,
    headers: options.headers || {},
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if(error){
        console.log(error);
      }else{
        var $ = res.$;
        console.log($("title").text());
      }
      done();
    }
  })
  return crawler
}
async function getList(contract, page) {
  const crawler = getC()
  return new Promise((resolve)=>{
    crawler.queue({
      uri: `https://cn.etherscan.com/txs?a=${contract}&ps=100&p=1`,
      callback: function (error, res, done) {
        if(error){
          console.log(error)
        } else {
          const $ = res.$
          const list = $('#paywall_mask table tr');
          let failCount = 0;
          list.each((index, item)=>{
            const isFail = $(item).find('.text-danger,.text-warning').length > 0;
            if (isFail) {
              failCount ++;
              return;
            }
            const txHash = $(item).find('td:nth-child(2) a').text()
            console.log('========start===========')
            console.log('index', index)
            console.log('\n')
            console.log('txHash', txHash)
            console.log('========end===========')
          })
          console.log('failCount', failCount)
          // console.log(res.body)
          // fs.writeFileSync(file, res.body)
          // resolve(111)
        }
        done()
      }
    })
  })
}

async function fixTx(index) {
  const fileTxInfoList = "./data/" + contract + "_txinfo_list.json";
  const txinfoFileJson = await jsonfile.readFileSync(fileTxInfoList);
  const data = await getTxInfo(txinfoFileJson[index].hash, index)
  txinfoFileJson[index] = data;
  jsonfile.writeFile(txinfoFileJson, txinfoFileJson)
}

function parseData($, txhash, index) {
  return new Promise((resolve => {
    function findRow(rowNumber) {
      return $($(`#ContentPlaceHolder1_maintable .row`).get(rowNumber - 1))
    }
    try {
      const $row = findRow(4);
      const time = $row.find('.col-md-9').text().match(/\((.*?)\)/m)[1];
      const success = !!findRow(2).find('.u-label--success').length > 0;
      if (findRow(7).text().indexOf('action') === -1) {
        resolve({
          hash: txhash,
          success: false
        });
        return;
      }
      const $actions = findRow(7).find('.media-body');
      const actions = [];
      if (!success) {
        resolve({
          hash: txhash,
          success: false
        });
        return;
      }
      let actionFailed = false;
      $actions.each((index, el)=>{
        const $action = $(el);
        const $els = $action.find('.mr-1:not(img)');
        const actionName = $($els.get(0)).text();
        if (actionFailed) {
          return ;
        }
        if (actionName.indexOf('Swap failed') >= 0) {
          actionFailed = true;
        }
        let action;
        if (actionName === 'Swap' || actionName === 'Executed Swap') {
          const inCoinName = $($els.get(2)).text();
          const inCoinAmount = $($els.get(1)).text();
          const outCoinName = $($els.get(5)).text();
          const outCoinAmount = $($els.get(4)).text();
          const platform = $($els.get(7)).text();
          action = {
            actionName,
            inCoinName,
            inCoinAmount,
            outCoinName,
            outCoinAmount,
            platform,
          };
        } else if (actionName === 'Collected') {
          const collectedCoinName = $($els.get(2)).text();
          const collectedCoinAmount = $($els.get(1)).text();
          const suppliedCoinName = $($els.get(4)).text();
          const platform = $($els.get(6)).text();
          action = {
            actionName,
            collectedCoinName,
            collectedCoinAmount,
            suppliedCoinName,
            platform
          };
        } else if (actionName === 'Withdraw') {
          const withdrawCoinName = $($els.get(2)).text();
          const withdrawCoinAmount = $($els.get(1)).text();
          const platform = $($els.get(4)).text();
          action = {
            actionName,
            withdrawCoinName,
            withdrawCoinAmount,
            platform
          };
        } else if (actionName === 'Supply') {
          const supplyCoinName = $($els.get(2)).text();
          const supplyCoinAmount = $($els.get(1)).text();
          const platform = $($els.get(4)).text();
          action = {
            actionName,
            supplyCoinName,
            supplyCoinAmount,
            platform
          };
        } else if (actionName === 'Liquidator Repay' || actionName === 'Liquidation') {
          const coinName = $($els.get(2)).text();
          const coinAmount = $($els.get(1)).text();
          const platform = $($els.get(4)).text();
          action = {
            actionName,
            coinName,
            coinAmount,
            platform
          };
        } else if(actionName === 'Enable' || actionName === 'Disable') {
          const coinName = $($els.get(1)).text();
          const platform = $($els.get(3)).text();
          action = {
            actionName,
            coinName,
            platform
          };
        } else if(actionName === 'Remove' || actionName === 'ADD') {
          const coin1Name = $($els.get(2)).text();
          const coin1Amount = $($els.get(1)).text();
          const coin2Name = $($els.get(5)).text();
          const coin2Amount = $($els.get(4)).text();
          const platform = $($els.get($els.length - 1)).text();
          action = {
            actionName,
            coin1Name,
            coin1Amount,
            coin2Name,
            coin2Amount,
            platform
          };
        }else if(!actionFailed){
          console.error('actionName', actionName)
          console.error('hash', txhash)
          const coinAmount = $($els.get(1)).text();
          const coinName = $($els.get(2)).text();
          const platform = $($els.get($els.length - 1)).text();
          action = {
            actionName,
            coinName,
            coinAmount,
            platform
          }
        }

        actions.push(action);
      });
      if (actionFailed) {
        resolve({
          success: false,
          hash: txhash
        });
        return;
      }
      const tokensTransferred = [];
      const $tokensTransferred = findRow(8).find('.media-body');
      $tokensTransferred.each((index, el)=>{
        const $row = $(el);
        // console.log($row.text(), 'text')
        const $coins = $row.find('a span');
        const from = $($coins.get(0)).attr('title');
        const to = $($coins.get(1)).attr('title');
        let coinName;
        let coinSymbol;
        // console.log('$coins.get(2)',$($coins.get(2)).attr())
        // console.log('$coins.get(2)1',$($row.find('a').get(2)).text())
        if ($coins.get(2)) {
          coinName = $($coins.get(2)).attr('title');
          const match = $($row.find('a').get(2)).text().match(/\((.*?)\)/);
          if (match && match[1].indexOf('...') === -1) {
            coinSymbol = match[1];
          } else {
            coinSymbol = $($row.find('a').get(2)).find('span:nth-child(2)').attr('title');
          }
        } else {
          const name = $($row.find('a').get(2)).text().trim();
          // USD Coin (USDC)
          coinName = name.match(/[^(]*/)[0].trim();
          coinSymbol = name.match(/\((.*?)\)/)[1].trim();
        }
        const coinAmount = $($row.find('> span').get(5)).text().trim();
        // console.log('$row.text()', $row.text(),'\nindex', index)
        const coinValueMatch = $row.text().match(/\(\$(.*?)\)/);
        const coinValue = coinValueMatch ? coinValueMatch[1] : '';
        tokensTransferred.push({
          from,
          to,
          coinAmount,
          coinSymbol,
          coinName,
          coinValue
        })
      });

      const $value = findRow(9).find('#ContentPlaceHolder1_spanValue');
      let ethAmount = $value.find('span').text();
      let ethValue = $value.find('button').text().trim().replace(/\((.*)\)/,'$1');
      if (ethAmount === '0 Ether ($0.00) 0 Ether') {
        ethAmount = '0 Ether';
        ethValue = '$0.00';
      }
      const $fee = findRow(10).find('#ContentPlaceHolder1_spanTxFee');
      const feeAmount = $fee.find('span').text();
      const feeValue = $fee.find('button').text().trim().replace(/\((.*)\)/,'$1');

      const gasPriceText = findRow(11).find('#ContentPlaceHolder1_spanGasPrice').text();
      const gasPrice = gasPriceText.match(/^[^\s]+/)[0];
      const gasPriceValue = gasPriceText.match(/\((.*?)\)/)[1];
      resolve({
        index,
        hash: txhash,
        success,
        actions,
        tokensTransferred,
        ethAmount,
        ethValue,
        time,
        feeAmount,
        feeValue,
        gasPrice,
        gasPriceValue,
      });
    } catch (e) {
      console.error('爬取错误', txhash, '\n', $.text());
      console.log('\n');
      console.log(e);
      resolve({
        index,
        error: true,
        hash: txhash
      });
    }
  }))
}

async function getTxInfo(txhash, index) {
  const crawler = getC()
  return new Promise(async (resolve)=>{
    const url = `https://cn.etherscan.com/tx/${txhash}`
    const datas = await requestMultiUrls('https://etherscan.io/tx/0xcdbe45646811006e7ef00563253fe7834c993f018ba898391a5987228a2716b3');

    crawler.queue({
      uri: url,
      callback: function (error, res, done) {
        const $ = res.$
        parseData($, txhash)
      }
    })
  })
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function getTxListInfo (contract) {
  const file = "./data/" + contract + "_unique.json";
  let fileJson = await jsonfile.readFileSync(file);
  console.log('length', fileJson.length)
  let startIndex = 0;

  const latestTx = await findLatest();
  if (latestTx) {
    console.log('latestTx', latestTx)
    startIndex = latestTx.index;
  }
  console.log('起始start', startIndex)
  console.log('fileJson', fileJson.length);
  // console.log(fileJson[fileJson.length - 1].blockNumber);
  for (let i = startIndex; i < fileJson.length; i++) {
    const urls = [];
    var starttime = new Date();
    for ( let j = 0; j < step && (i + j) < fileJson.length; j++) {
      console.log('i', i + j);
      const index = i + j;
      const { hash } = fileJson[index];
      const url = `https://cn.etherscan.com/tx/${hash}`;
      urls.push(url);
    }
    const txList = await requestMultiUrls(urls);
    console.log('批量请求成功', txList.length);
    for (let k = 0; k < txList.length; k++) {
      const index = i + k;
      const txinfo = txList[k];
      const { hash } = fileJson[index];
      // console.log('txinfo', txinfo)
      if (txinfo.success) {
        const body = txinfo.data;
        // console.log('\n\n\n\n');
        // console.log('body\n',body)
        // console.log('\n\n\n\n');
        const $ = cheerio.load(body);
        const tx = await parseData($, hash, index);
        // console.log('格式化后的数据', tx);
        console.log('插入数据', index, tx.success);
        if (tx.success) {
          await insertTx(tx);
        } else {
          await insertTx(tx);
        }
      } else {
        console.log('插入数据', index);
        await insertTx({
          index,
          hash,
          error: true
        });
      }
      await delay(10);
    }
    var costTime = new Date() - starttime;
    var leftTime = (fileJson.length - i - txList.length) / (urls.length * 1000 / costTime) /  60;
    console.log('========剩余时间====');
    console.log('=====' + leftTime + '分钟====');
    // await delay(3000);
    i += step - 1;
  }
  console.log('解析完毕')
}

async function fixErrorInfo(contract) {
  let counter = 0;
  do {
    counter = 0;
    let records = await findErrorRecords();
    console.log('总数据', records.length);
    for (let i = 0; i < records.length; i++) {
      const urls = [];
      var starttime = new Date();
      for ( let j = 0; j < step && (i+j) < records.length; j++) {
        console.log('i', i + j);
        const index = i + j;
        const { hash } = records[index];
        const url = `https://cn.etherscan.com/tx/${hash}`;
        urls.push(url);
      }
      const txList = await requestMultiUrls(urls);

      for (let k = 0; k < txList.length; k++) {
        const index = i + k;
        const txinfo = txList[k];
        const { hash,_id } = records[index];
        // console.log('txinfo', txinfo)
        if (txinfo.success) {
          const body = txinfo.data;
          // console.log('\n\n\n\n');
          // console.log('body\n',body)
          // console.log('\n\n\n\n');
          const $ = cheerio.load(body);
          const tx = await parseData($, hash, index);
          console.log('更新数据', index, tx.success);
          if (tx.success) {
            tx.error = false;
            await updateOne(_id,tx);
            counter++;
          } else if(tx.success === false){
            console.log('格式化后的数据', tx);
            console.log('补充错误数据', index);
            counter++;
            await updateOne(_id, {success: undefined, hash, error: false});
          }
        }
        console.log('修复进度', 100 * (counter / records.length).toFixed(4) + '%');
        await delay(30);
      }
      // await delay(1000);
      var costTime = new Date() - starttime;
      var leftTime = (records.length - i - txList.length) / (urls.length * 1000 / costTime) /  60;
      console.log('========剩余时间====');
      console.log('=====' + leftTime + '分钟====');
      i += step - 1;
    }
  } while ((await findErrorRecords()).length > 0)
  console.log('都修复完了');
}
const contract = '0x11111254369792b2ca5d084ab5eea397ca8fa48b';
getTxListInfo(contract)
// (async()=>{
//   const info = await getTxInfo('0x6f836be55815b458a998d6cdf10605f644c9745237122d782cf73afd3d96c3eb')
//   console.log('info', info)
// })();
// fixErrorInfo(contract);
// fixTx()
// getHistoryByAddress(contract)
// getList(contract, 1)
// unique(contract)
