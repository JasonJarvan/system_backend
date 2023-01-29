const mysql = require("../common/mysql");
const moment = require("moment");
const countRedis = require("../common/redis/countRedis");
const bsRedis = require("../common/redis/bsredis");
const mySqlConn = mysql({ dbname: "monitor", multipleStatements: true });
const centerConn = mysql({ dbname: "center" });
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");

function dashboard() {
  const that = this;

  that.getTodeskCount = async () => {
    const yesterday = moment().subtract(1, "days").unix();
    const today = moment().startOf("day").unix();
    const lastWeek = moment().subtract(1, "weeks").unix();
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_free_todesk WHERE time=(SELECT MAX(time) FROM count_free_todesk);
      SELECT * FROM count_free_todesk WHERE time=(SELECT MAX(time) FROM count_free_todesk WHERE time<?);
      SELECT * FROM count_free_todesk WHERE time=(SELECT MAX(time) FROM count_free_todesk WHERE time<?);
      SELECT * FROM count_free_todesk WHERE (\`key\` LIKE 'week_%' OR \`key\` LIKE 'month_%') AND time=?;`,
      values: [yesterday, lastWeek, today]
    });
    const { result: productResult } = await mySqlConn.runQuery({
      sql: `SELECT *
        FROM count_free_todesk_order WHERE time=(SELECT MAX(time) FROM count_free_todesk_order) AND \`key\` = "today_order" AND charge_type <> 3;
      SELECT *
        FROM count_free_todesk_order WHERE time=(SELECT MAX(time) FROM count_free_todesk_order WHERE time< ?) AND \`key\` = "today_order" AND charge_type <> 3;
      SELECT *
        FROM count_free_todesk_order WHERE time=(SELECT MAX(time) FROM count_free_todesk_order WHERE time< ?) AND \`key\` = "today_order" AND charge_type <> 3;`,
      values: [yesterday, lastWeek]
    });
    const { result: orderUserResult } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_free_todesk_order 
      WHERE time=(SELECT MAX(time) FROM count_free_todesk_order) AND \`key\` LIKE "order%" AND charge_type=0;
      SELECT * FROM count_free_todesk_order WHERE \`key\` = "month_order_user" AND charge_type=0 order by time desc LIMIT 1;`
    });
    const { result: productSPUResult } = await centerConn.runQuery({
      sql: `SELECT id, name, status FROM tv_product_spu;`
    });
    const data = {
      countData: {},
      // productData: {},
      // countResult: result,
      productResult: productResult,
      productSPUMap: {}
    };
    for (const item of result[0]) {
      data.countData[item.key] = item.value;
    }
    for (const item of result[1]) {
      data.countData["ytd_" + item.key] = item.value;
    }
    for (const item of result[2]) {
      data.countData["lastweek_" + item.key] = item.value;
    }
    for (const item of result[3]) {
      data.countData[item.key] = item.value;
    }
    for (const item of productSPUResult) {
      data.productSPUMap[item.id] = item.name;
    }
    for (const item of orderUserResult) {
      for (const itm of item) {
        data.countData[itm.key] = itm.value;
      }
    }
    return data;
  };

  that.getCount = async () => {
    const data = await countRedis.getCount();
    return data;
  };
  that.getNewCount = async () => {
    const data = await countRedis.getNewCount();
    return data;
  };
  // 获取7天控端数据
  that.getWeekTdCount = async () => {
    // 获取7天的数据
    const week = moment().subtract(6, "days").startOf("day").unix();

    const { result } = await mySqlConn.runQuery({
      sql: `SELECT \`key\`,value,time FROM count_free_todesk WHERE \`key\` in ('srctd','dsttd') AND time>=? ORDER BY id`,
      values: [week]
    });
    const weekData = {};
    result.forEach((item) => {
      const date = moment.unix(item.time).format("YYYY-MM-DD");
      const dayData = weekData[date];
      if (dayData) {
        const timeData = dayData.find((i) => i.date == item.time);
        if (timeData) {
          timeData[item.key] = item.value;
        } else {
          dayData.push({
            [item.key]: item.value,
            date: item.time
          });
        }
      } else {
        weekData[date] = [{ [item.key]: item.value, date: item.time }];
      }
    });
    return weekData;
  };

  that.getOrderAnalysis = async () => {
    const monthTimestamp = [];
    for (let i = 0; i < 30; i++) {
      monthTimestamp.push(
        moment()
          .subtract(i, "days")
          .startOf("day")
          .subtract(1, "seconds")
          .unix()
      );
    }
    const month = moment().subtract(30, "days").startOf("day").unix();
    const { result: newTime } = await mySqlConn.runQuery({
      sql: `SELECT max(time) as time FROM count_free_todesk_order`
    });
    const { time: today } = newTime[0];
    const { result: today_order } = await mySqlConn.runQuery({
      sql: `SELECT \`key\`, sum(value) as value, time FROM count_free_todesk_order 
      WHERE \`key\` = "today_order" AND time > ${month}
      AND time IN ('${monthTimestamp.join("','")}','${today}')
      GROUP BY time ORDER BY time ASC;`
    });
    const { result: today_order_first } = await mySqlConn.runQuery({
      sql: `SELECT \`key\`, charge_type, value, time FROM count_free_todesk_order 
      WHERE \`key\` = "today_order_first" AND time > ${month}
      AND time IN ('${monthTimestamp.join("','")}','${today}')
      ORDER BY charge_type, time ASC;`
    });
    const { result: today_order_renewal } = await mySqlConn.runQuery({
      sql: `SELECT \`key\`, charge_type, sum(value) as value, time FROM count_free_todesk_order 
      WHERE \`key\` = "today_order_renewal" AND time > ${month}
      AND time IN ('${monthTimestamp.join("','")}','${today}')
      GROUP BY charge_type, time ORDER BY time ASC;`
    });
    return { today_order, today_order_first, today_order_renewal };
  };

  // that.getOrderAnalysis = async () => {
  //   const month = moment().subtract(30, "days").startOf("day").unix();
  //   const { result: newTime } = await mySqlConn.runQuery({
  //     sql: `SELECT max(time) as time FROM count_free_todesk`
  //   });
  //   const { time: today } = newTime[0];
  //   const { result: todayOrderResult } = await mySqlConn.runQuery({
  //     sql: `SELECT sum(value) as total, time FROM count_free_todesk_order
  //     WHERE \`key\` = "today_order" AND time > ${month}
  //     AND (DATE_FORMAT(FROM_UNIXTIME(time),'%H%i%s')='235959'  OR time = ${today})
  //     ORDER BY time `
  //   });
  //   const { result } = await mySqlConn.runQuery({
  //     sql: `SELECT \`key\`,value,time FROM count_free_todesk WHERE \`key\`
  //     IN ('today_order_new','today_order_renew','order_total','today_order_total')
  //     AND time > ? AND (DATE_FORMAT(FROM_UNIXTIME(time),'%H%i')='2355' OR time = ?) ORDER BY time `,
  //     values: [month, today]
  //   });

  //   const data = {}, financeData = {};
  //   const financeMap = {
  //     order_total: "total_order",
  //     today_order_total: "order_count",
  //     today_order_renew: "renew_order",
  //     today_order_new: "new_order"
  //   };
  //   for (const { key, value, time } of result) {
  //     const date = moment.unix(time).format("YYYYMMDD");
  //     if (financeData[date]) {
  //       financeData[date][financeMap[key]] = value;
  //     } else {
  //       financeData[date] = { [financeMap[key]]: value };
  //     }
  //   }
  //   data.financeData = financeData;
  //   data.todayOrderResult = todayOrderResult;
  //   return data;
  // };

  that.getProductOrderAnalysis = async (req) => {
    // product是商品ID, date是每天235959的unix时间戳
    const { product = 2, date = moment().endOf("day").unix() } = req.query;
    // 要加上最后一天的最晚的数据
    const { result: newTime } = await mySqlConn.runQuery({
      sql: `SELECT MAX(time) AS time FROM count_free_todesk WHERE time <= ${date}`
    });
    const { time: newestTime } = newTime[0];
    const month = moment.unix(date).subtract(30, "days").startOf("day").unix();
    const { result: productOrderResult } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_free_todesk_order
      WHERE \`key\` = "today_order" AND product = ${product} 
      AND time > ${month} AND time < ${date}
      AND (DATE_FORMAT(FROM_UNIXTIME(time),'%H%i%s')='235959' OR time = ${newestTime})
      ORDER BY time`
    });
    return productOrderResult;
  };

  that.getGMV = async (req) => {
    const { date } = req.query;
    const monthTimestamp = [];
    for (let i = 0; i < 30; i++) {
      monthTimestamp.push(
        moment()
          .subtract(i, "days")
          .startOf("day")
          .subtract(1, "seconds")
          .unix()
      );
    }
    const { result: newTime } = await mySqlConn.runQuery({
      sql: `SELECT MAX(time) AS time FROM count_free_todesk`
    });
    const { time: today } = newTime[0];
    const timeStrMap = {
      hours: [
        `AND time > ${moment(date).startOf("day").unix()} 
        AND time < ${moment(date).endOf("day").unix()}`,
        `AND time > ${moment(date).subtract(1, "days").startOf("day").unix()} 
         AND time < ${moment(date).subtract(1, "days").endOf("day").unix()}`,
        `AND time > ${moment(date).subtract(7, "days").startOf("day").unix()} 
         AND time < ${moment(date).subtract(7, "days").endOf("day").unix()}`
      ],
      days: [
        `AND time > ${moment()
          .subtract(30, "days")
          .startOf("day")
          .unix()} AND (time IN ('${monthTimestamp.join("','")}','${today}'))`
      ]
    };
    const data = {
      today_order_income_total: { hours: {}, days: {} },
      today_order_income_first: { hours: {}, days: {} },
      today_order_income_renewal: { hours: {}, days: {} }
    };
    const keys = [
      "today_order_income_total",
      "today_order_income_first",
      "today_order_income_renewal"
    ];
    for (const key of keys) {
      for (const timeType in timeStrMap) {
        let sql = "";
        timeStrMap[timeType].forEach((timeStr) => {
          sql =
            sql +
            `SELECT * FROM count_free_todesk_order 
                WHERE  \`key\` IN ('${key}') 
                AND charge_type = 0 ${timeStr} ORDER BY time;`;
        });
        data[key][timeType] = (await mySqlConn.runQuery({ sql })).result;
      }
    }
    return data;
  };

  that.getEnterpriseAnalysis = async () => {
    const crtMysqlData = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM todesk_business_count ORDER BY id DESC LIMIT 1;`
      })
    ).result[0];
    const yesterday = moment.unix(crtMysqlData.time).subtract(1, "days");
    const ytdMysqlData = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM todesk_business_count WHERE time<? ORDER BY id DESC LIMIT 1;`,
        values: [yesterday.unix()]
      })
    ).result[0];
    const lastweek = moment.unix(crtMysqlData.time).subtract(7, "days");
    const lastweekMysqlData = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM todesk_business_count WHERE time<? ORDER BY id DESC LIMIT 1;`,
        values: [lastweek.unix()]
      })
    ).result[0];
    const online = await bsRedis.getOnlineTdCount();
    const { srctd, dsttd } = await bsRedis.getControlTdCount();
    // console.log(crtMysqlData, ytdMysqlData, online, srctd, dsttd);
    return {
      crtMysqlData,
      ytdMysqlData,
      lastweekMysqlData,
      bsRedisData: {
        online,
        srctd,
        dsttd
      }
    };
  };

  that.getOverseaAnalysis = async () => {
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_deskin WHERE time=(SELECT MAX(time) FROM count_deskin)`
    });
    // 昨日
    const yesterday = moment().subtract(1, "days").unix();
    const { result: ytdResult } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_deskin WHERE time=(SELECT MAX(time) FROM count_deskin WHERE time<?)`,
      values: [yesterday]
    });
    const today = moment().startOf("day").unix();
    const { result: weekMonthResult } = await mySqlConn.runQuery({
      sql: `SELECT * FROM count_deskin WHERE (\`key\` LIKE 'week_%' OR \`key\` LIKE 'month_%') AND time=?`,
      values: [today]
    });
    const data = {};
    for (const item of result) {
      data[item.key] = item.value;
    }
    for (const item of ytdResult) {
      data["ytd_" + item.key] = item.value;
    }
    for (const item of weekMonthResult) {
      data[item.key] = item.value;
    }
    return data;
  };

  that.getEnterpriseCount = async () => {
    const month2400stamp = [];
    for (let i = 0; i < 30; i++) {
      month2400stamp.push(
        moment()
          .subtract(i, "days")
          .startOf("day")
          .subtract(5, "minutes")
          .unix()
      );
    }
    let whereStr = `WHERE \`key\` IN ('company_total','user_total','today_company_total', 'today_user_total', 'today_device_total','today_sos','today_srctd','today_dsttd')
     AND time IN ('${month2400stamp.join("','")}')`;
    let sql = `SELECT * FROM count_enterprise_todesk ${whereStr} ORDER BY time DESC `;
    // console.log(sql);
    const list = (
      await mySqlConn.runQuery({
        sql
      })
    ).result;
    return list;
  };

  that.getUserRenewal = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM count_user_renewal ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM count_user_renewal ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getUserPaid = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM count_user_paid ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM count_user_paid ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  return that;
}

module.exports = new dashboard();
