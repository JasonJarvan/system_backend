const Redis = require("ioredis");
const { result } = require("lodash");
const moment = require("moment");
const host = process.env.BSRIDS_HOST || "localhost";
const port = process.env.BSRIDS_PORT || 6380;
const password = process.env.BSRIDS_PASSWORD || 123456;
const conflictKey = "todesk:conflict";
// b端sredis
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});

const getConflict = async () => {
  const result = await client.smembers(`${conflictKey}`);
  return result;
};
const addConflict = async (uuidguid) => {
  await client.sadd(`${conflictKey}`, uuidguid);
};
const delConflict = async (uuidguid) => {
  await client.srem(`${conflictKey}`, uuidguid);
};
const getOnlineTdCount = async () => {
  try {
    return await client.scard("todesk:online:clients");
  } catch (error) {
    return;
  }
};
const getControlTdCount = async (day) => {
  const redisKeySrcTdPrefix = "daysrctd:";
  const redisKeyDstTdPrefix = "daydsttd:";
  try {
    if (!day) {
      day = moment().format("YYYYMMDD");
    }
    const srctd = await client.scard(redisKeySrcTdPrefix + day);
    const dsttd = await client.scard(redisKeyDstTdPrefix + day);
    return { srctd, dsttd };
  } catch (error) {
    console.error(error);
    return;
  }
};
const getCompanyChannelDay = async (companyid) => {
  const redisKey = `companychannelday:${companyid}`;
  try {
    const result = await client.hgetall(redisKey);
    return result;
  } catch (error) {
    console.error(error);
    return;
  }
};
const getCompanyUserLocks = async (userInfo) => {
  try {
    /* const loginLockResult = await client.keys(`user:email:limit:${userInfo.user_type == 4
      ? userInfo.email.slice(userInfo.email.indexOf('_') + 1, -1).toLowerCase()
      : userInfo.email}:*`);
    const passwordLockResult = await client.keys(`user:password:1:${userInfo.id}`); */

    // let loginLockPointer = 0, loginLockResult = [], passwordLockPointer = 0, passwordLockResult = [];
    // do {
    //   const result = await client.scan(loginLockPointer, 'match', `user:email:limit:${userInfo.email}:*`, 'count', 1000);
    //   loginLockPointer = result[0];
    //   loginLockResult = [...loginLockResult, ...result[1]];
    // } while (loginLockPointer != 0)
    // do {
    //   const result = await client.scan(passwordLockPointer, 'match', `user:password:1:${userInfo.id}`, 'count', 1000);
    //   passwordLockPointer = result[0];
    //   passwordLockResult = [...passwordLockResult, ...result[1]];
    // } while (passwordLockPointer != 0)

    // let loginLockPointer = 1, loginLockResult = [], passwordLockPointer = 1, passwordLockResult = [];
    // while (loginLockPointer != 0) {
    //   const result = await client.scan(loginLockPointer, 'match', `user:email:limit:${userInfo.email}:*`);
    //   loginLockPointer = result[0];
    //   loginLockResult = [...loginLockResult, ...result[1]];
    // }
    // while (passwordLockPointer != 0) {
    //   const result = await client.scan(passwordLockPointer, 'match', `user:password:1:${userInfo.id}`);
    //   passwordLockPointer = result[0];
    //   passwordLockResult = [...passwordLockResult, ...result[1]];
    // }
    // return { passwordLock: passwordLockResult.length > 0, loginLock: loginLockResult.length > 0 };
    return { passwordLock: false, loginLock: false };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const delCompanyUserLocks = async (config) => {
  try {
    let result;
    if (config.passwordLock === false && config.id) {
      result = await client.del(`user:password:1:${config.id}`);
    }
    if (config.loginLock === false && config.email) {
      // let loginLockPointer = 1, loginLockResult = [];
      // while (loginLockPointer != 0) {
      //   const result = await client.scan(loginLockPointer, 'match', `user:email:limit:${config.email}:*`);
      //   loginLockPointer = result[0];
      //   loginLockResult = [...loginLockResult, ...result[1]];
      // }
      const loginLockResult = await client.keys(
        `user:email:limit:${config.email}:*`
      );
      loginLockResult.forEach(async (item) => {
        result = await client.del(item);
      });
    }
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = {
  getConflict,
  addConflict,
  delConflict,
  getOnlineTdCount,
  getControlTdCount,
  getCompanyChannelDay,
  getCompanyUserLocks,
  delCompanyUserLocks,
  client
};
