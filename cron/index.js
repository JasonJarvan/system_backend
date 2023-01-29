let envpath = "./env/.env";
switch (process.env.NODE_ENV) {
  case undefined:
    break;
  case "production":
    envpath += ".prod";
    break;
  default:
    envpath += `.${process.env.NODE_ENV}`;
    break;
}
require("dotenv").config({ path: envpath });

const cron = require("node-cron");
const userCount = require("./userCount");
const saveCount = require("./saveCount");
const daily = require("./daily");
const warnBot = require("./warnBot");

const taskPer5min = () => {
  userCount();
};

const taskPerHour = () => {
  // warnBot();
};

const taskDaily = () => {
  daily();
  saveCount();
};

// 每5分钟执行一次
// cron.schedule("*/5 * * * *", taskPer5min);

// 每小时执行一次
// cron.schedule("0 * * * *", taskPerHour);

// 每天23点50分执行一次
cron.schedule("0 50 23 * * *", taskDaily);
