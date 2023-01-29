const Redis = require("ioredis");
const moment = require("moment");
const { productTypeDic } = require("../../userCenter/dictionary");
const host = process.env.CRIDS_HOST || "localhost";
const port = process.env.CRIDS_PORT || 6379;
const password = process.env.CRIDS_PASSWORD || 123456;

const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});
const redisKeyOnline = "tdonlineinfo";
const redisKeyNewTdPrefix = "daynewtd:";
const redisKeySrcTdPrefix = "newdaysrctd:";
const redisKeyDstTdPrefix = "newdaydsttd:";
const newTdPrefix = "llc:daynewtd:";
const srcTdPrefix = "llc:newdaysrctd:";
const dstTdPrefix = "llc:newdaydsttd:";
const webnewTdPrefix = "web:daynewtd";
const websrcTdPrefix = "web_daysrctd:";
const webdstTdPrefix = "web_daydsttd:";
/**
 *
 * @param null
 * @returns online td
 */
const getOnlineTdCount = async () => {
  try {
    let result = await client.scard(redisKeyOnline);
    return result;
  } catch (error) {
    // console.log(error)
    return;
  }
};

/**
 *
 * @returns {} new Set of id of online users
 */
const getControlTdCount = async (day) => {
  try {
    if (!day) {
      day = moment().format("YYYYMMDD");
    }
    const yesterday = moment().subtract(1, "days").format("YYYYMMDD");
    const lastweekday = moment().subtract(7, "days").format("YYYYMMDD");

    const newtd = await client.pfcount(newTdPrefix + day);
    const srctd = await client.pfcount(srcTdPrefix + day);
    const dsttd = await client.pfcount(dstTdPrefix + day);
    const webnewtd = await client.pfcount(webnewTdPrefix + day);
    const websrctd = await client.pfcount(websrcTdPrefix + day);
    const webdsttd = await client.pfcount(webdstTdPrefix + day);
    const ytd_webnewtd = await client.pfcount(webnewTdPrefix + yesterday);
    const ytd_websrctd = await client.pfcount(websrcTdPrefix + yesterday);
    const ytd_webdsttd = await client.pfcount(webdstTdPrefix + yesterday);
    const lastweek_webnewtd = await client.pfcount(webnewTdPrefix + lastweekday);
    const lastweek_websrctd = await client.pfcount(websrcTdPrefix + lastweekday);
    const lastweek_webdsttd = await client.pfcount(webdstTdPrefix + lastweekday);

    return {
      newtd, srctd, dsttd,
      webnewtd, websrctd, webdsttd,
      ytd_webnewtd, ytd_websrctd, ytd_webdsttd,
      lastweek_webnewtd, lastweek_websrctd, lastweek_webdsttd
    };
  } catch (error) {
    // console.log(error)
    return;
  }
};

module.exports = {
  getOnlineTdCount,
  getControlTdCount,
  client
};
