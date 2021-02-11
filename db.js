var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var databaseName = 'blockchain';
var tableName = 'oneinch8fa48b';
var ObjectID = require('mongodb').ObjectID;
const jsonfile = require('jsonfile')

function insertTx(tx) {
  return new Promise((resolve => {
    console.log('chrru======', url)
    MongoClient.connect(url, function(err, db) {
      console.log('数据库连接成功')
      if (err) throw err;
      var dbo = db.db(databaseName);
      tx.saveTime = +new Date();
      dbo.collection(tableName).insertOne(tx, function(err, res) {
        if (err) throw err;
        console.log("文档插入成功");
        db.close();
        resolve();
      });
    });
  }))
}

function findAllTx(query = {}) {
  return new Promise(resolve => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db(databaseName);
      dbo.collection(tableName).find(query).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;
        resolve(result);
        db.close();
      });
    });
  });
}

function removeTx(query) {
  return new Promise(resolve => {
    MongoClient.connect(url, async function(err, db) {
      if (err) throw err;
      var dbo = db.db(databaseName);
      await dbo.collection(tableName).deleteOne(query);
      resolve();
      db.close();
    });
  });
}
function updateMany(querys, updateObjects) {
  return new Promise(resolve => {
    MongoClient.connect(url, async function(err, db) {
      if (err) throw err;
      var dbo = db.db(databaseName);
      for (let i = 0; i < querys.length; i++) {
        let query = querys[i];
        try {
          await dbo.collection(tableName).updateOne(query, {$set: updateObjects[i]});
        } catch (e) {
          console.log('ee', e.message);
        }
      }
      resolve();
      db.close();
    });
  });
}
async function updateOne(id, data) {
  return new Promise(resolve => {
    MongoClient.connect(url, async function(err, db) {
      if (err) throw err;
      var dbo = db.db(databaseName);
      try {
        await dbo.collection('oneinch').updateOne({_id: ObjectID(id)}, {$set: data});
      } catch (e) {
        console.log('ee', e.message);
      }
      resolve();
      db.close();
    });
  });
}
function findLatest() {
  return new Promise(resolve => {
    MongoClient.connect(url, async function(err, db) {
      if (err) throw err;
      var dbo = db.db(databaseName);
      var tx = await dbo.collection(tableName).findOne({}, {sort: { saveTime: -1 },});
      db.close();
      resolve(tx);
    });
  });
}

async function findErrorRecords() {
  const allErrorTx = await findAllTx({error: false, success: false});
  return allErrorTx;
}

// insertTx({"index":0,"hash":"0x6f836be55815b458a998d6cdf10605f644c9745237122d782cf73afd3d96c3eb","success":true,"actions":[{"actionName":"Swap","inCoinName":"Ether","inCoinAmount":"10.7","outCoinName":"USDC","outCoinAmount":"17,796.26164","platform":"Sushiswap"},{"actionName":"Executed Swap","inCoinName":"Ether","inCoinAmount":"10.7","outCoinName":"USDC","outCoinAmount":"17,796.26164","platform":"1inch.exchange"}],"tokensTransferred":[{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"SushiSwap: USDC (0x397ff1542f962076d0bfe58ea045ffa2d347aca0)","coinAmount":"10.7","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"17,543.83"},{"from":"SushiSwap: USDC (0x397ff1542f962076d0bfe58ea045ffa2d347aca0)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"17,796.26164","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"17,748.34"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x4334fc936bd246f0e9ce8c0e182e6f9d9ceee2b7","coinAmount":"17,796.26164","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"17,748.34"}],"ethAmount":"10.7 Ether","ethValue":"$17,543.83","time":"Feb-05-2021 01:15:13 PM +UTC","feeAmount":"0.05044347 Ether","feeValue":"$82.71","gasPrice":"0.000000251","gasPriceValue":"251 Gwei"})
// insertTx({"index":1,"hash":"0xcbaac9b3d48339960fea1b8b4704e8836f0f938ffaefd5ff0434af28238ae4fd","success":true,"actions":[{"actionName":"Collected","collectedCoinName":"COMP","collectedCoinAmount":"0.075276289215745003","suppliedCoinName":"DAI","platform":"Compound"},{"actionName":"Supply","supplyCoinName":"DAI","supplyCoinAmount":"189,012","platform":"Compound"},{"actionName":"Collected","collectedCoinName":"COMP","collectedCoinAmount":"0.33130523408604657","suppliedCoinName":"USDC","platform":"Compound"},{"actionName":"Withdraw","withdrawCoinName":"USDC","withdrawCoinAmount":"189,063.621413","platform":"Compound"},{"actionName":"Swap","inCoinName":"WBTC","inCoinAmount":"7.475","outCoinName":"Ether","outCoinAmount":"169.462910191246411777","platform":"Sushiswap"},{"actionName":"Swap","inCoinName":"WBTC","inCoinAmount":"8.125","outCoinName":"Ether","outCoinAmount":"184.474581668658956327","platform":"Uniswap"},{"actionName":"Swap","inCoinName":"Ether","inCoinAmount":"95.804712604183667335","outCoinName":"USDC","outCoinAmount":"159,535.207172","platform":"Uniswap"},{"actionName":"Swap","inCoinName":"Ether","inCoinAmount":"140.02227226765305226","outCoinName":"USDC","outCoinAmount":"233,246.08277","platform":"Sushiswap"},{"actionName":"Executed Swap","inCoinName":"WBTC","inCoinAmount":"40","outCoinName":"USDC","outCoinAmount":"1,511,385.733962","platform":"1inch.exchange"}],"tokensTransferred":[{"from":"0xf8c42927a60cbd4a536ce24ef8bed00b16a9b44b","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"40","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"1,573,520.00"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x6a11f3e5a01d129e566d783a7b6e8862bfd66cca","coinAmount":"2","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"78,676.00"},{"from":"0x0000000000000000000000000000000000000000","to":"0x2eea44e40930b1984f42078e836c659a12301e40","coinAmount":"0.00480440600306481","coinSymbol":"1LP-ETH-WBTC","coinName":"1inch Liquidity Pool (ETH-WBTC)","coinValue":""},{"from":"0xb4db55a20e0624edd82a0cf356e3488b4669bd27","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"75,505.881373","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"75,302.54"},{"from":"0x0000000000000000000000000000000000000000","to":"0x2eea44e40930b1984f42078e836c659a12301e40","coinAmount":"0.004786832265988058","coinSymbol":"1LP-ETH-USDC","coinName":"1inch Liquidity Pool (ETH-USDC)","coinValue":""},{"from":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"189,012","coinSymbol":"DAI","coinName":"Dai Stablecoin","coinValue":"189,012.00"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","coinAmount":"5","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"196,690.00"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","coinAmount":"189,012","coinSymbol":"DAI","coinName":"Dai Stablecoin","coinValue":"189,012.00"},{"from":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","to":"Compound Dai (0x5d3a536e4d6dbd6114cc1ead35777bab948e3643)","coinAmount":"189,012","coinSymbol":"DAI","coinName":"Dai Stablecoin","coinValue":"189,012.00"},{"from":"Compound Dai (0x5d3a536e4d6dbd6114cc1ead35777bab948e3643)","to":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","coinAmount":"8,987,858.1902916","coinSymbol":"cDAI","coinName":"Compound Dai","coinValue":"188,539.92"},{"from":"Compound USD Coin (0x39aa39c021dfbae8fac545936693ac917d5e7563)","to":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","coinAmount":"189,063.621413","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"188,554.47"},{"from":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","to":"Compound USD Coin (0x39aa39c021dfbae8fac545936693ac917d5e7563)","coinAmount":"8,772,268.97177865","coinSymbol":"cUSDC","coinName":"Compound USD Coin","coinValue":"188,399.30"},{"from":"Curve.fi: USDT Swap (0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"189,063.621413","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"188,554.47"},{"from":"DODO: WBTC-USDC (0x2109f78b46a789125598f5ad2b7f243751c2934d)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"66,252.698161","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"66,074.28"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"DODO: WBTC-USDC (0x2109f78b46a789125598f5ad2b7f243751c2934d)","coinAmount":"1.75","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"68,841.50"},{"from":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"198,713.55","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"198,178.41"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","coinAmount":"5.25","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"206,524.50"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"SushiSwap: WBTC (0xceff51756c56ceffca006cd410b03ffc46dd3a58)","coinAmount":"7.475","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"294,051.55"},{"from":"SushiSwap: WBTC (0xceff51756c56ceffca006cd410b03ffc46dd3a58)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"169.462910191246411777","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"277,853.08"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"Uniswap V2: WBTC 2 (0xbb2b8038a1640196fbe3e38816f3e67cba72d940)","coinAmount":"8.125","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"319,621.25"},{"from":"Uniswap V2: WBTC 2 (0xbb2b8038a1640196fbe3e38816f3e67cba72d940)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"184.474581668658956327","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"302,466.37"},{"from":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"235.629970319686430885","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"386,341.26"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","coinAmount":"10.4","coinSymbol":"WBTC","coinName":"Wrapped BTC","coinValue":"409,115.20"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"Uniswap V2: USDC 3 (0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc)","coinAmount":"95.804712604183667335","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"157,082.36"},{"from":"Uniswap V2: USDC 3 (0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"159,535.207172","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"159,105.58"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"SushiSwap: USDC (0x397ff1542f962076d0bfe58ea045ffa2d347aca0)","coinAmount":"140.02227226765305226","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"229,581.92"},{"from":"SushiSwap: USDC (0x397ff1542f962076d0bfe58ea045ffa2d347aca0)","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"233,246.08277","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"232,617.95"},{"from":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","to":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","coinAmount":"589,087.554265","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"587,501.14"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x56178a0d5f301baf6cf3e1cd53d9863437345bf9","coinAmount":"353.740477307755079394","coinSymbol":"WETH","coinName":"Wrapped Ether","coinValue":"579,996.42"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0x910bf2d50fa5e014fd06666f456182d4ab7c8bd2","coinAmount":"18.861192","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"18.81"},{"from":"1inch.exchange v2: Router (0xe069cb01d06ba617bcdf789bf2ff0d5e5ca20c71)","to":"0xf8c42927a60cbd4a536ce24ef8bed00b16a9b44b","coinAmount":"1,511,385.733962","coinSymbol":"USDC","coinName":"USD Coin","coinValue":"1,507,315.57"}],"ethAmount":"0 Ether ($0.00) 0 Ether","ethValue":"","time":"Feb-05-2021 01:15:07 PM +UTC","feeAmount":"0.505323936 Ether","feeValue":"$828.53","gasPrice":"0.000000234","gasPriceValue":"234 Gwei"})
// findLatest().then(console.log, console.error);
async function fix () {
  const allTx = await findAllTx({success: true});
  var counter = allTx.length;
  var querys = []
  var updates = [];
  for (let rec of allTx) {
    if (rec.ethAmount === '0 Ether ($0.00) 0 Ether') {
      querys.push({
        _id: ObjectID(rec._id)
      });
      updates.push({
        ethAmount: '0 Ether',
        ethValue: '$0.00'
      })
    }
  }
  await updateMany(querys, updates);
  console.log('counter', counter)
}
fix()
module.exports.insertTx = insertTx;
module.exports.fix = fix;
module.exports.findLatest = findLatest;
module.exports.findErrorRecords = findErrorRecords;
module.exports.updateOne = updateOne;
