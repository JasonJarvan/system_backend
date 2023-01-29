const mysql = require("../common/mysql");
const mySqlConn = mysql({ dbname: "admin", multipleStatements: true });
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const { client: sredis } = require("../common/redis/sredis");
const { client: credis } = require("../common/redis/credis");
const { client: dredis } = require("../common/redis/dredis");
const { client: bsredis } = require("../common/redis/bsredis");
const { client: uredis } = require("../common/redis/uRedis");
const { get } = require("lodash");
const cRedisColl = { sredis, credis, dredis, uredis };
const redisQuery = async (redis, key) => {
  let result = {};
  if ((await redis.exists(key))) {
    const keyType = await redis.type(key);
    switch (keyType) {
      case 'string':
        result = { type: 'string', data: await redis.get(key), ttl: await redis.ttl(key) };
        break;
      case 'list':
        result = { type: 'list', data: ["已禁用list/set/zset类型查询"] };
        // const listLen = await redis.llen(key);
        // if (listLen > 100) result = { type: 'listLen', data: listLen };
        // else result = { type: 'list', data: await redis.lrange(key, 0, -1) };
        break;
      case 'hash':
        result = { type: 'hash', data: await redis.hgetall(key), ttl: await redis.ttl(key) };
        break;
      case 'set':
        // result = { type: 'set', data: await redis.smembers(key) };
        result = { type: 'set', data: ["已禁用list/set/zset类型查询"] };
        break;
      case 'zset':
        // result = { type: 'zset', data: await redis.zrange(key, 0, -1, 'WITHSCORES') };
        result = { type: 'zset', data: ["已禁用list/set/zset类型查询"] };
        break;
      default:
        break;
    }
  };
  return result;
}
module.exports = function model() {
  const that = this;
  that.getRedisQuery = async (req) => {
    const { redisType, key } = req.query;
    let resultColl = {};
    if (redisType == 0) {// 0 个人版；1 企业版
      for (const redis in cRedisColl) {
        const result = await redisQuery(cRedisColl[redis], key);
        if (result && JSON.stringify(result) != "{}") resultColl[redis] = result;
      }
    } else {
      const result = await redisQuery(bsredis, key);
      if (result && JSON.stringify(result) != "{}") resultColl.bsredis = result;
    }
    return resultColl;
  };

  that.getServiceGover = async (req) => {
    let whereStr = `WHERE 1=1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, name, service_name, load_balance, port, lasted_deploy_time, created_time FROM ums_service
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_service
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getServiceGoverByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_service WHERE id = '${req.params.id}'`
      })
    ).result;
  };

  that.updateServiceGover = async (req) => {
    let config = req.body;
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_service SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update config, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_service SET ? `,
        values: config
      });
      return `insert config, result: ${result}`;
    }
  };

  that.deleteServiceGover = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_service WHERE id = ? `,
      values: [id]
    });
    return result;
  };

  that.getServicePod = async (req) => {
    let whereStr = `WHERE 1=1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT name, ip, port, status FROM ums_service_pod
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_service_pod
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getServicePodByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT p.*, s.name AS service_name, s.service_name AS service_name_name
        FROM ums_service_pod AS p
        LEFT JOIN ums_service AS s ON p.service_id = s.id
        WHERE p.id = '${req.params.id}'`
      })
    ).result;
  };

  that.getServicePodByServiceID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_service_pod WHERE service_id = '${req.params.id}'`
      })
    ).result;
  };

  that.updateServicePod = async (req) => {
    let config = req.body;
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_service_pod SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update config, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_service_pod SET ? `,
        values: config
      });
      return `insert config, result: ${result}`;
    }
  };
  that.deleteServicePod = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_service_pod WHERE id = ? `,
      values: [id]
    });
    return result;
  };
  return that;
};
