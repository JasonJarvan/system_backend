const Redis = require("ioredis");
const host = process.env.SRIDS_HOST || "localhost";
const port = process.env.SRIDS_PORT || 6380;
const password = process.env.SRIDS_PASSWORD || 123456;
const useronlinePrefix = "useronline_comet:";
const cometfdPrefix = "cometfd";
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});
/**
 *
 * @param {number} userid
 * @returns list of online driver
 */
const getbyUserid = async (userid) => {
  try {
    const useronlineComet = await client.smembers(
      `${useronlinePrefix}${userid}`
    );
    const cometfd = [];
    for (const comet of useronlineComet) {
      const data = JSON.parse(comet);
      const fd = await client.get(
        `${cometfdPrefix}_${data.onserver}_${data.fd}`
      );
      cometfd.push(fd);
    }
    const result = [];
    for (const fd of cometfd) {
      const online = await client.get(`online:${fd}`);
      result.push(JSON.parse(online));
    }
    return result;
  } catch (error) {
    // console.log(error)
    return;
  }
};

/**
 *
 * @param {number} userId
 * @returns list of user online status
 */
const checkUserOnlineStatus = async (userId) => {
  try {
    return await client.exists(`${useronlinePrefix}${userId}`);
  } catch (error) {
    // console.log(error)
    return 0;
  }
};

module.exports = {
  getbyUserid,
  checkUserOnlineStatus,
  client
};
