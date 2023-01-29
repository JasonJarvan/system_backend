const fs = require("fs");
const path = require("path");
const Redis = require("ioredis");
const moment = require("moment");

const countDirPath = path.join(__dirname, "/count");
const host = "10.13.190.80";
const port = 6379;
const password = "fya12345FYD";

const getCount = async (date) => {
  let client;
  try {
    client = new Redis({ host, port, password });
    const result = await client.get(`daycountyy:${date}`);
    return result && JSON.parse(result);
  } catch (error) {
    // console.log(error)
    return;
  } finally {
    client && client.disconnect();
  }
};

const task = async () => {
  const format = "YYYYMMDD";
  let date = moment();
  let lastDate = moment().subtract(6, "months");
  const exists = fs.existsSync(countDirPath);
  if (!exists) {
    fs.mkdirSync(countDirPath);
  }
  console.log("save count start: ", date.format(format));
  while (date.isAfter(lastDate)) {
    const count = await getCount(date.subtract(1, "days").format(format));
    console.log("getCount", date.format(format));
    if (count) {
      console.log("write file:", date.format(format));
      fs.writeFileSync(
        path.join(countDirPath, `${date.format(format)}.json`),
        JSON.stringify(count, null, 2)
      );
    }
  }
  console.log("done");
};

module.exports = task;
