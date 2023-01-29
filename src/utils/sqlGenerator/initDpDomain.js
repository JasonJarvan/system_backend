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

const mysql = require("../../module/common/mysql");
const mySqlConn = mysql({ dbname: "admin" });

/**
 * 仅用于初始化ums_dispatch_config表的dp_domain字段
 * @param {*} mySqlConn 
 */
const initDpDomain = async (mySqlConn) => {
  const list = (await mySqlConn.runQuery({
    sql: `SELECT * FROM ums_dispatch_config`
  })).result;
  dpValDelAV(list).forEach(async (val, ind) => {
    await mySqlConn.runQuery({
      sql: `UPDATE ums_dispatch_config SET ? WHERE id= ? `,
      values: [val, val.id]
    });
  })
}

/**
 * 从dp_value的condition中删除AVBackend,
 * 再将dp_value的platform的AVBackend放到dp_domain中
 * @param {}} dpVal 
 * @returns 删除AVBackend后的dp_value字符串
 */
const dpValDelAV = (value) => {
  value.forEach((val, ind) => {
    let dpVal = "";
    dpVal = JSON.parse(val.dp_value);
    dpVal = dpVal.map((v, ind) => {
      if (v.ruler == "platform") {
        let delAVCond = v.condition.map((v, ind, ary) => {
          if (v == "AVBackend") {
            val.dp_domain = "AVBackend";
            return;
          }
          return v;
        })
        v.condition = delAVCond.filter(item => item != undefined);
      }
      return v;
    })
    dpVal = JSON.stringify(dpVal);

    val.dp_value = dpVal;
  })
  console.log(value);
  return value;
}

initDpDomain(mySqlConn);
