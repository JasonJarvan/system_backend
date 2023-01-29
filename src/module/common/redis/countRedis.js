const Redis = require("ioredis");
const moment = require("moment");
const host = process.env.COUNT_REDIS_HOST || "localhost";
const port = process.env.COUNT_REDIS_PORT || 6380;
const password = process.env.COUNT_REDIS_PASSWORD || 123456;
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});

const getCount = async () => {
  try {
    const date = moment().subtract(1, "days").format("YYYYMMDD");
    const result = await client.get(`daycountyy:${date}`);
    return result && JSON.parse(result);
  } catch (error) {
    // console.log(error)
    return;
  }
};

const getNewCount = async () => {
  try {
    const date = moment().subtract(1, "days").format("YYYYMMDD");
    const result = await client.get(`llcdaycountyy:${date}`);
    return result && JSON.parse(result);
  } catch (error) {
    // console.log(error)
    return;
  }
};

module.exports = {
  getCount,
  getNewCount,
  client
};
