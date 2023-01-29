const mysql = require("../common/mysql");
const mySqlMonitorConn = mysql({
  dbname: "monitor",
  multipleStatements: true
});
const mySqlCenterConn = mysql({ dbname: "center" });
const mongoDB = require("../common/mongodb")();
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const moment = require("moment");

module.exports = function dashboard() {
  let that = this;
  that.getAPMLogNums = async (query) => {
    const docs = await mongoDB
      .db("apm_log")
      .collection("apm_aggre")
      .aggregate([
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: { $add: ["$createDate", 8 * 3600000] }
                }
              },
              version: "$version"
            },
            count: {
              $sum: "$total"
            }
          }
        },
        {
          $sort: {
            date: -1
          }
        }
      ])
      .toArray();
    return docs;
  };

  that.getfuncName = async (query) => {
    const queryObj = JSON.parse(query.data);
    const docs = await mongoDB
      .db("apm_log")
      .collection("apm_aggre")
      .aggregate([
        {
          $match: {
            createDate: {
              $gte: new Date(moment(queryObj.date)),
              $lt: new Date(moment(queryObj.date).add(1, "days"))
            },
            version: queryObj.version
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: { $add: ["$createDate", 8 * 3600000] }
                }
              },
              version: "$version",
              function_name: "$function_name",
              code_file: "$code_file"
            },
            count: { $sum: "$total" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
      .toArray();
    return docs;
  };

  that.getAPMLogs = async (query) => {
    const queryObj = JSON.parse(query.data);
    const docs = await mongoDB
      .db("apm_log")
      .collection("apm_details")
      .find({
        createDate: {
          $gte: new Date(moment(queryObj.date)),
          $lt: new Date(moment(queryObj.date).add(1, "days"))
        },
        version: queryObj.version
      })
      .sort({ _id: -1 })
      .toArray();
    return docs;
  };

  that.getOperationLog = async (query) => {
    const queryObj = JSON.parse(query.data);
    const docs = await mongoDB
      .db("middleplatform_log")
      .collection("action_log")
      .find({
        $and: [
          queryObj.filter?.service ? { service: queryObj.filter?.service } : {},
          {
            time: {
              $gte: moment()
                .subtract(queryObj.filter?.time, "days")
                .format("YYYY-MM-DD HH:mm:ss")
            }
          }
        ]
      })
      .skip(queryObj.current * queryObj.pageSize)
      .limit(queryObj.pageSize)
      .sort({ time: -1 })
      .toArray();
    const total = await mongoDB
      .db("middleplatform_log")
      .collection("action_log")
      .find({
        $and: [
          queryObj.filter?.service ? { service: queryObj.filter?.service } : {},
          {
            time: {
              $gte: moment()
                .subtract(queryObj.filter?.time, "days")
                .format("YYYY-MM-DD HH:mm:ss")
            }
          }
        ]
      })
      .count();
    return { docs, total };
  };

  that.getSettingRequest = async () => {
    const stamp30days = moment().subtract(30, "days").unix();
    let whereStr = `WHERE project = "setting" AND time >= ${stamp30days}`;
    let sql = `SELECT * FROM monit_ratio ${whereStr} ORDER BY time DESC `;
    const list = (
      await mySqlMonitorConn.runQuery({
        sql
      })
    ).result;
    return list;
  };

  that.getTobmsgbus = async (req) => {
    const queryObj = JSON.parse(req.query.data);
    const stamp30days = moment().subtract(30, "days").unix();
    let whereStr = `WHERE project = "tobmsgbus" AND type = "${queryObj.typeName}" AND time >= ${stamp30days}`;
    let sql = `SELECT * FROM monit_ratio ${whereStr} ORDER BY time DESC `;
    const list = (
      await mySqlMonitorConn.runQuery({
        sql
      })
    ).result;
    return list;
  };

  that.getAndCtrlDelLog = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT a.*, u.nickname, u.phone, u.email 
    FROM tv_android_controlled_deletelog AS a
    LEFT JOIN tv_user AS u ON a.userid=u.id
    ${SQLpostfixGenerator(whereStr, req.query)}`;
    let getCountSql = `SELECT COUNT(*) AS total
    FROM tv_android_controlled_deletelog AS a
    LEFT JOIN tv_user AS u ON a.userid=u.id
     ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlCenterConn);
  };

  that.getInstallInfo = async (req) => {
    const { platType, date } = req.query;
    const timePlatMap = {
      hours: {
        total: "last5mins_device",
        windows: "last5mins_clienttype_1",
        mac: "last5mins_clienttype_2",
        ios: "last5mins_clienttype_3",
        android: "last5mins_clienttype_4",
        linux: "last5mins_clienttype_5",
        green: "last5mins_clienttype_6"
      },
      days180: {
        total: "today_device",
        windows: "today_clienttype_1",
        mac: "today_clienttype_2",
        ios: "today_clienttype_3",
        android: "today_clienttype_4",
        linux: "today_clienttype_5",
        green: "today_clienttype_6"
      },
      days: {
        total: "today_device",
        windows: "today_clienttype_1",
        mac: "today_clienttype_2",
        ios: "today_clienttype_3",
        android: "today_clienttype_4",
        linux: "today_clienttype_5",
        green: "today_clienttype_6"
      },
      months: {
        total: "month_device",
        windows: "month_clienttype_1",
        mac: "month_clienttype_2",
        ios: "month_clienttype_3",
        android: "month_clienttype_4",
        linux: "month_clienttype_5",
        green: "month_clienttype_6"
      }
    };
    const timeStr = (timeType) => {
      if (timeType == "hours") {
        // 最近24小时安装量，查过去24小时的每5分钟安装数
        return [
          `AND time > ${moment(date).subtract(1, "days").startOf('day').unix()} 
           AND time < ${moment(date).endOf('day').unix()}`,
          `AND time > ${moment(date).subtract(7, "days").startOf('day').unix()} 
           AND time < ${moment(date).subtract(7, "days").endOf('day').unix()}`
        ];
      } else if (timeType == "days") {
        // 最近30天安装量 查过去30天每天最后一条(23:55)今日安装数
        const timeStamp = [];
        for (let i = 0; i < 37; i++) {
          timeStamp.push(
            moment()
              .subtract(i, "days")
              .startOf("day")
              .subtract(5, "minutes")
              .unix()
          );
        }
        return [`AND time IN ('${timeStamp.join("','")}')`];
      } else if (timeType == "days180") {
        // 最近180天安装量 查过去6个月每天最后一条(23:55)今日安装数
        const timeStamp = [];
        for (let i = 0; i < 187; i++) {
          timeStamp.push(
            moment()
              .subtract(i, "days")
              .startOf("day")
              .subtract(5, "minutes")
              .unix()
          );
        }
        return [`AND time IN ('${timeStamp.join("','")}')`];
      }
    };
    const timeTypes = ["hours", "days180"],
      results = {};
    for (const timeType of timeTypes) {
      let sql = "";
      timeStr(timeType).forEach((value) => {
        sql =
          sql +
          `SELECT * FROM count_free_todesk 
        WHERE \`key\` = '${timePlatMap[timeType][platType]}'
        ${value}
        ORDER BY time DESC;`;
      });
      results[timeType] = (
        await mySqlMonitorConn.runQuery({
          sql
        })
      ).result;
    }
    // console.log(results);
    return results;
  };

  that.getControlInfo = async (req) => {
    const { platType, date } = req.query;
    const typeMap = {
      hours: {
        srctd: "last5mins_srctd",
        dsttd: "last5mins_dsttd"
      },
      days180: {
        srctd: "srctd",
        dsttd: "dsttd"
      }
    };
    const timeStr = (timeType) => {
      if (timeType == "hours") {
        // 最近24小时，查过去24小时的每5分钟
        return [
          `AND time > ${moment(date).subtract(1, "days").startOf('day').unix()} 
           AND time < ${moment(date).endOf('day').unix()}`,
          `AND time > ${moment(date).subtract(7, "days").startOf('day').unix()} 
           AND time < ${moment(date).subtract(7, "days").endOf('day').unix()}`
        ];
      } else if (timeType == "days180") {
        // 最近180天 查过去6个月每天最后一条(23:55)
        const timeStamp = [];
        for (let i = 0; i < 187; i++) {
          timeStamp.push(
            moment()
              .subtract(i, "days")
              .startOf("day")
              .subtract(5, "minutes")
              .unix()
          );
        }
        return [`AND time IN ('${timeStamp.join("','")}')`];
      }
    };
    const timeTypes = ["hours", "days180"],
      platTypes = ["srctd", "dsttd"],
      results = { srctd: {}, dsttd: {} };
    for (const platType of platTypes) {
      for (const timeType of timeTypes) {
        let sql = "";
        timeStr(timeType).forEach((value) => {
          sql =
            sql +
            `SELECT * FROM count_free_todesk 
        WHERE \`key\` = '${typeMap[timeType][platType]}'
        ${value}
        ORDER BY time DESC;`;
        });
        results[platType][timeType] = (
          await mySqlMonitorConn.runQuery({
            sql
          })
        ).result;
      }
    }
    // console.log(results);
    return results;
  };

  that.getOnlineInfo = async (req) => {
    const { date } = req.query;
    const results = {};
    results.hours = (
      await mySqlMonitorConn.runQuery({
        sql: `SELECT * FROM count_free_todesk 
          WHERE \`key\` = 'online'
          AND time > ${moment(date).subtract(1, "days").startOf('day').unix()} AND time < ${moment(date).endOf('day').unix()}
          ORDER BY time DESC;
          SELECT * FROM count_free_todesk 
          WHERE \`key\` = 'online'
          AND time > ${moment(date).subtract(7, "days").startOf('day').unix()} AND time < ${moment(date).subtract(7, "days").endOf('day').unix()}
          ORDER BY time DESC;`
      })
    ).result;
    results.days180 = (
      await mySqlMonitorConn.runQuery({
        sql: `SELECT MAX(a.value) AS value,UNIX_TIMESTAMP(a.date) AS time
          FROM (SELECT value,time,DATE(FROM_UNIXTIME(time)) AS date
          FROM count_free_todesk WHERE \`key\` = 'online'
          AND time > ${moment().subtract(187, "days").unix()}) a 
          GROUP BY a.date ORDER BY time DESC;`
      })
    ).result;
    // console.log(results);
    return results;
  };

  that.getUserInfo = async (req) => {
    const typeMap = {
      hours: {
        total: "last5mins_total_count",
        wechat: "last5mins_wechat_user",
        wechatReg: "last5mins_wechat_user_registered"
      },
      days180: {
        total: "today_total_count",
        wechat: "today_wechat_user",
        wechatReg: "today_wechat_user_registered"
      }
    };
    const timeStr = (timeType) => {
      if (timeType == "hours") {
        // 最近24小时，查过去24小时的每5分钟
        return [
          `AND time > ${moment().subtract(2, "days").unix()}`,
          `AND time > ${moment()
            .subtract(8, "days")
            .unix()} AND time < ${moment().subtract(7, "days").unix()}`
        ];
      } else if (timeType == "days180") {
        // 最近180天 查过去6个月每天最后一条(23:55)
        const timeStamp = [];
        for (let i = 0; i < 187; i++) {
          timeStamp.push(
            moment()
              .subtract(i, "days")
              .startOf("day")
              .subtract(5, "minutes")
              .unix()
          );
        }
        return [`AND time IN ('${timeStamp.join("','")}')`];
      }
    };
    const { platType } = req.query;
    const timeTypes = ["hours", "days180"],
      results = {};

    for (const timeType of timeTypes) {
      let sql = "";
      timeStr(timeType).forEach((value) => {
        sql =
          sql +
          `SELECT * FROM count_free_todesk 
        WHERE \`key\` = '${typeMap[timeType][platType]}'
        ${value}
        ORDER BY time DESC;`;
      });
      results[timeType] = (
        await mySqlMonitorConn.runQuery({
          sql
        })
      ).result;
    }
    // console.log(results);
    return results;
  };
  // getUserInfo({ query: { platType: 'total' } });
  // // 生成数据脚本
  // that.insertData = async () => {
  //   // 插入每5分钟的数据
  //   for (let i = 1656663900; i <= moment().unix(); i += 300) {
  //     const data = {
  //       key: "online",
  //       time: i,
  //       value: Math.floor(Math.random() * 100000),
  //       desc: "在线总数",
  //       type: "device",
  //     }
  //     await mySqlMonitorConn.runQuery({
  //       sql: `INSERT INTO count_free_todesk SET ?`,
  //       values: data
  //     })
  //   }
  //   // 插入6个月的每日数据
  //   for (let i = 0; i < 187; i++) {
  //     const data = {
  //       key: "today_wechat_user_registered",
  //       time: moment()
  //         .subtract(i, "days")
  //         .startOf("day")
  //         .subtract(5, "minutes")
  //         .unix(),
  //       value: Math.floor(Math.random() * 10000),
  //       desc:"微信注册并绑定手机用户",
  //       type:"user",
  //     }
  //     await mySqlMonitorConn.runQuery({
  //       sql: `INSERT INTO count_free_todesk SET ?`,
  //       values: data
  //     })
  //   }
  // }
  // insertData()

  that.getMsgMonitor = async (query) => {
    const { phone } = query;
    const docs = await mongoDB
      .db("logs")
      .collection("sms_send_log")
      .find({
        phone,
        send_time: {
          $gt: moment().subtract(7, "days").unix(),
          $lt: moment().unix()
        }
      })
      .sort({ send_time: -1 })
      .toArray();
    return docs;
  };

  that.getMsgStatistics = async (query) => {
    const { date } = query;
    const docs = await mongoDB
      .db("logs")
      .collection("sms_send_log")
      .aggregate([
        {
          $match: {
            send_time: {
              $gt: moment(date).startOf('day').unix(),
              $lt: moment(date).endOf('day').unix()
            },
          }
        },
        {
          $group: {
            _id: {
              status: "$status",
              operator: "$operator",
            },
            count: { $sum: 1 }
          }
        },
      ])
      .sort({ send_time: -1 })
      .toArray();
    return docs;
  };
  return that;
};
