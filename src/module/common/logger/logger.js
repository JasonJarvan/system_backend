
//const logger = require("../mongodb").collection("logger");
// const logger = require("../mongodb").collection("logger");
// let log4js = require("log4js");
// log4js.configure({
//   appenders: {
//     user: { type: "file", filename: "user.log", pattern: '.yyyy-MM-dd', compress: true },
//     system: { type: "file", filename: "system.log", pattern: '.yyyy-MM-dd', compress: true },
//     admin: { type: "file", filename: "admin.log", pattern: '.yyyy-MM-dd', compress: true }
//   },
//   categories: { default: { appenders: ["user", "system", "admin"], level: process.env.LOG_LEV || "error" } }
// });
// var logger = log4js.getLogger('user');
// logger.level = process.env.LOG_LEV || "error";

let debugLevel = process.env.LOG_LEV || "error";
const config = {
  fatal: ["fatal"],
  error: ["fatal", "error"],
  warn: ["fatal", "error", "warn"],
  info: ["fatal", "error", "warn", "info"],
  debug: ["fatal", "error", "warn", "info", "debug"],
  trace: ["fatal", "error", "warn", "info", "debug", "trace"]
};
/**
* logger:
*   @param {string} type: string
*   @param {string} level:string
*   @param {string} content:string
*   @param {string} updateTime:string
*/
const insert = async (type, level, content) => {
  if (config[debugLevel].includes(level)) {
    console.log(`${new Date()} [${type}] [${level}]:${content}`);
    // logger.insertOne({
    //   type,
    //   level,
    //   content,
    //   updateTime: new Date()
    // });
  }
};
module.exports = {
  insert
}