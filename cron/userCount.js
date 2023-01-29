const mysql = require("../src/module/common/mysql");
const {
  getOnlineTdCount,
  getControlTdCount
} = require("../src/module/common/redis/credis");
const moment = require("moment");

const adminDB = mysql({ dbname: "admin" });
const centerDB = mysql({ dbname: "center" });

const task = async () => {
  console.log("task begin.");
  const online_count = await getOnlineTdCount();
  const control_count = await getControlTdCount();
  console.log("get onlint count:", online_count);
  console.log("get control count:", control_count);
  const today = moment().startOf("day").unix();
  const yesterday = moment().subtract(1, "days").startOf("day").unix();
  const week = moment().subtract(7, "days").startOf("day").unix();
  const month = moment().subtract(30, "days").startOf("day").unix();
  const date = moment().unix();
  const user_count = (
    await centerDB.runQuery({
      sql: `SELECT COUNT(1) AS total_count,
    COUNT(IF(viplevel>0,true,null)) AS total_vip_count,
    COUNT(IF(regdate>? AND regdate<?,true,null)) AS last_day_count,
    COUNT(IF(regdate>? AND regdate<?,true,null)) AS last_week_count,
    COUNT(IF(regdate>? AND regdate<?,true,null)) AS last_month_count
    FROM tv_user`,
      values: [yesterday, today, week, today, month, today]
    })
  ).result[0];
  const order_count = (
    await centerDB.runQuery({
      sql: `SELECT COUNT(1) total_order,
      COUNT(IF(pay_time>=?,TRUE,NULL)) order_count,
      COUNT(IF(is_renew=1 AND pay_time>=?,TRUE,NULL)) renew_order,
      COUNT(IF(is_renew=0 AND pay_time>=?,TRUE,NULL)) new_order
      FROM tv_order_buy WHERE state=1;`,
      values: [today, today, today]
    })
  ).result[0];
  console.log("get user count:", user_count);
  console.log("get order count:", order_count);
  const { result } = await adminDB.runQuery({
    sql: `INSERT INTO ums_user_count SET ?`,
    values: {
      date,
      ...user_count,
      online: online_count,
      ...control_count,
      ...order_count
    }
  });
  console.log("task complete:", result.insertId);
};

module.exports = task;
