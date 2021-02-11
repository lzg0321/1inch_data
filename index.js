// https://api.dydx.exchange/v1/orderbook/PBTC-USDC
const jsonfile = require('jsonfile')
const schedule = require('node-schedule')
const axios = require('axios')
const file = './data.json';

async function getData(trys = 0) {
  const res = await axios.get('https://api.dydx.exchange/v1/orderbook/ETH-USDC').catch(()=>null)
  if (!res) {
    if (trys < 5) {
      return await getData(++trys);
    } else {
      return null;
    }
  }
  return res.data;
}

// 启动任务
let job = schedule.scheduleJob('0 */10 * * * *', async () => {
  const data = await getData();
  const fileJson = await jsonfile.readFileSync(file);
  const input = {
    datetime: new Date().toString(),
    data
  };
  fileJson.push(input);
  jsonfile.writeFile(file, fileJson,{ spaces: 2, EOL: '\r\n' }, function (err) {
    if (err) {
      console.error(err);
    }
  })
});
