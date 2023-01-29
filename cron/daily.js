const mysql = require("../src/module/common/mysql");
const moment = require("moment");
const { decodeArray2Result } = require("./common");

const adminDB = mysql({ dbname: "admin" });
const centerDB = mysql({ dbname: "center", multipleStatements: true });

// 统计today_order/today_paid_order/today_paid_money
const daily = async () => {
  console.log("Daily task begin.");
  const date = moment().format("YYYYMMDD");

  const dailyResult = (
    await centerDB.runQuery({
      sql:
        `SELECT COUNT(*) AS user_num,
          COUNT(IF(viplevel>0, true, null)) AS user_vip_num,
          COUNT(IF(viplevel IN (2,4), true, null)) AS user_vip24_num,
          COUNT(IF(viplevel IN (3,5), true, null)) AS user_vip35_num
          FROM tv_user;
        SELECT COUNT(*) AS mac_num FROM tv_mac;
        SELECT COUNT(*) AS wechat_num,
          COUNT(IF(is_registered = 1, true, null)) AS wechat_registered_num 
          FROM tv_wechat_user;
        SELECT COUNT(*) AS ios_num FROM tv_ios_user;
        SELECT COUNT(*) AS group_num, 
          COUNT(IF(readonly = 0, true, null)) AS group_created_num 
          FROM tv_group;
        SELECT COUNT(*) AS order_num, 
          COUNT(IF(state=1 AND is_refund=0, true, null)) AS order_paid_num 
          FROM tv_order_buy;
        SELECT COUNT(*) AS machine_num FROM tv_macine;
        SELECT COUNT(IF(loginin=1, true, null)) AS machine_logined_num FROM tv_macine;
        SELECT COUNT(IF(active=1, true, null)) AS machine_active_num  FROM tv_macine;
        SELECT COUNT(IF(pay_time!=0, true, null)) AS android_order_num FROM tv_controlled_order;
        SELECT COUNT(*) AS android_machine_num FROM tv_android_controlled ;
        `
    })
  ).result;
  let decodedResult = decodeArray2Result(dailyResult);
  console.info("decodedResult = ", decodedResult);
  const { result } = await adminDB.runQuery({
    sql: `INSERT INTO ums_user_stats SET ?`,
    values: { date, ...decodedResult }
  });
  console.log("task complete, ums_user_stats.id = ", result.insertId);
};



module.exports = daily;
