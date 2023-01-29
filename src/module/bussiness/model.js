const mysql = require("../common/mysql");
const { escape: mysqlEscape } = require("mysql");
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator,
  converDataListToObject,
  whenThenGenerator,
  inGenerator
} = require("../common/modelHelper.js");
const {
  getConflict,
  addConflict,
  delConflict,
  getCompanyChannelDay,
  getCompanyUserLocks,
  delCompanyUserLocks
} = require("../common/redis/bsredis");
const lodash = require("lodash");
const moment = require("moment");
const { subscribeConfig } = require("../common/nacos");
const bussinessDB = mysql({ dbname: "bussiness", multipleStatements: true });
const adminDB = mysql({ dbname: "admin", multipleStatements: true });

/**
 * 订单SN生成器，格式：操作员ID3位；毫秒时间字符串；预留2位；随机数3位
 * @param {*} userid
 * @returns
 */
const snGenerator = (userid) => {
  const useridString = `000${userid.toString()}`;
  var randomnNum = "";
  for (var i = 0; i < 3; i++) {
    randomnNum += Math.floor(Math.random() * 10);
  }
  return `${useridString.substring(
    useridString.length - 3,
    useridString.length
  )}${moment().format("YYYYMMDDHHmmssSSS")}00${randomnNum}`;
};

/**
 * 判断订单是否可被更改
 * @param {*} order tv_order表的订单object
 * @returns boolean
 */
const isEffectiveOrder = (order) => {
  return (
    (order.status == 1 || order.status == 2) &&
    moment(order.end_time).unix() > moment().unix()
  );
};

function model() {
  const that = this;
  let permissionValue = {};
  subscribeConfig("company_permission", {
    init: (config) => (permissionValue = config)
  });
  let versionValue = {};
  subscribeConfig("company_version", {
    init: (config) => (versionValue = config)
  });
  that.getCompanyList = async (req) => {
    let whereStr = "WHERE a.id=b.company_id AND b.is_super_admin=1";
    whereStr = whereStrGenerator(whereStr, req.query, {
      id: "a.id",
      admin_phone: "b.phone",
      admin_email: "b.email"
    });
    let connTimeWhereStr = "",
      firstConnTimeWhereStr = "";
    const { conn_time, first_conn_time } = JSON.parse(req.query.options);
    if (conn_time && conn_time.length == 2) {
      connTimeWhereStr = `AND connected_time > '${conn_time[0]}' AND connected_time < '${conn_time[1]}'`;
    }
    if (first_conn_time && first_conn_time.length == 2) {
      firstConnTimeWhereStr = `AND connected_time > '${first_conn_time[0]}' AND connected_time < '${first_conn_time[1]}'`;
    }
    const sql = `SELECT a.*,b.phone AS admin_phone,IF(ISNULL(b.email),a.email,b.email) as admin_email,
    IF (ISNULL(a.expire_time),a.status,a.expire_time>CURRENT_TIMESTAMP) as enabled
    FROM tv_company a, tv_user b  ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(DISTINCT b.id) AS total FROM tv_company a, tv_user b ${whereStr}`;
    const mysqlResult = await getListBySQL(sql, getCountSql, bussinessDB);
    await Promise.all(mysqlResult.list.map(async(res,i)=>{
      const company_id = res.id;
      const channelDayResult = await getCompanyChannelDay(company_id);
      if (channelDayResult && Object.keys(channelDayResult).length !== 0) {
        const channelDayValues =
          conn_time && conn_time.length == 2
            ? lodash.filter(
                channelDayResult,
                (value, key) =>
                  key >= moment(conn_time[0]).format("YYYYMMDD") &&
                  key <= moment(conn_time[1]).format("YYYYMMDD")
              )
            : Object.values(channelDayResult).map(Number);
            mysqlResult.list[i].channel_day = Math.max(...channelDayValues);
      }
      const { result } = await bussinessDB.runQuery({
        sql: `SELECT
        (SELECT COUNT(1) FROM tv_user WHERE company_id=${company_id}) AS reg_users,
        (SELECT COUNT(1) FROM tv_user WHERE company_id=${company_id} AND status=1) AS enabled_users,
        (SELECT count(distinct(email)) FROM tv_machine_connection WHERE company_id=${company_id} ${connTimeWhereStr} ) AS actived_users,
        (SELECT COUNT(1) FROM tv_mac WHERE company_id=${company_id} AND to_desk_type=1) AS master_num,
        (SELECT COUNT(1) FROM tv_mac WHERE company_id=${company_id} AND to_desk_type=2) AS slave_num,
        (SELECT MIN(connected_time) FROM tv_machine_connection WHERE company_id=${company_id} ${firstConnTimeWhereStr}) AS first_conn_time,
        (SELECT count(1) FROM tv_machine_connection WHERE company_id=${company_id} ${connTimeWhereStr}) AS conn_num`
      });
      Object.assign(mysqlResult.list[i], result[0]);
    }))
    return mysqlResult;
  };
  that.getCompanyListCount = async (req) => {
    let { limit, offset } = req.query;
    let { sorter, dateRanger, conn_time, first_conn_time, searchKeys, filter } =
      JSON.parse(req.query.options);
    const whereStr = whereStrGenerator(
      "WHERE a.id=b.company_id AND b.is_super_admin=1",
      req.query,
      {
        id: "a.id",
        admin_phone: "b.phone",
        admin_email: "b.email"
      }
    );
    let connTimeWhereStr = "",
      firstConnTimeWhereStr = "";
    if (conn_time && conn_time.length == 2) {
      connTimeWhereStr = `AND connected_time > '${conn_time[0]}' AND connected_time < '${conn_time[1]}'`;
    }
    if (first_conn_time && first_conn_time.length == 2) {
      firstConnTimeWhereStr = `AND connected_time > '${first_conn_time[0]}' AND connected_time < '${first_conn_time[1]}'`;
    }
    const result = (
      await bussinessDB.runQuery({
        sql: `SELECT
      COUNT( if( (SELECT COUNT(1) FROM tv_mac WHERE company_id=a.id AND to_desk_type=1) >  0, 1, null)) AS count_master_num,
      COUNT( if( (SELECT COUNT(1) FROM tv_mac WHERE company_id=a.id AND to_desk_type=2) >  0, 1, null)) AS count_slave_num,
      COUNT( if( (SELECT count(1) FROM tv_machine_connection WHERE company_id=a.id ${connTimeWhereStr}) >  0, 1, null)) AS count_conn_num,
      COUNT( if( (SELECT COUNT(1) FROM tv_user WHERE company_id=a.id) >  1, 1, null)) AS count_reg_users
      FROM tv_company a, tv_user b
     ${SQLpostfixGenerator(
       whereStr,
       { limit, offset, sorter: {} },
       {
         id: "a.id",
         admin_phone: "b.phone",
         admin_email: "b.email"
       }
     )} `
      })
    ).result;
    return result;
  };
  that.getCompanyByID = async (req) => {
    return (
      await bussinessDB.runQuery({
        sql: `SELECT * FROM tv_company WHERE id=${req.params.id}`
      })
    ).result;
  };
  that.getCompanyInfoByID = async (req) => {
    const company = (
      await bussinessDB.runQuery({
        sql: `SELECT C.*, (SELECT count(1) FROM tv_user WHERE company_id=C.id AND status=1) AS active_user_num,
      (SELECT count(1) FROM tv_mac WHERE company_id=C.id AND to_desk_type=2 AND active=1) AS active_device_num
      FROM tv_company C
      WHERE C.id=${req.params.id}`
      })
    ).result;
    const company_permission = (
      await bussinessDB.runQuery({
        sql: `SELECT * FROM tv_company_permission WHERE company_id=${req.params.id}`
      })
    ).result;
    const system_setting = (
      await bussinessDB.runQuery({
        sql: `SELECT * FROM tv_system_setting WHERE company_id=${req.params.id}`
      })
    ).result;
    return { company, company_permission, system_setting };
  };
  that.updateCompany = async (req) => {
    const { id, ...vals } = req.body;
    const result = await bussinessDB.runQuery({
      sql: `UPDATE tv_company SET ? WHERE id= ? `,
      values: [vals, id]
    });
    return `update tv_company`;
  };
  that.updateCompanyStatus = async (req) => {
    const { status = 1, expire_time, id } = req.body;
    const result = await bussinessDB.runQuery({
      sql: `UPDATE tv_company SET ? WHERE id= ? `,
      values: [{ status, expire_time }, id]
    });
    return `update tv_company`;
  };

  that.getCompanyUserList = async (req) => {
    let whereStr = "WHERE u.company_id = c.id ";
    whereStr = whereStrGenerator(whereStr, req.query, {
      company_name: "c.name",
      email: "u.email",
      status: "u.status"
    });
    const sql = `SELECT u.*,c.name AS company_name FROM tv_user u, tv_company c 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_user u, tv_company c ${whereStr}`;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.getCompanyUserByID = async (req) => {
    const { result } = await bussinessDB.runQuery({
      sql: `SELECT u.*,c.name AS company_name FROM tv_user u, tv_company c WHERE u.company_id = c.id AND u.id=${req.params.id}`
    });
    let userInfo = {};
    if (result.length > 0) {
      userInfo = result[0];
      const userLocks = await getCompanyUserLocks(userInfo);
      return { ...userInfo, ...userLocks };
    } else {
      throw new Error("user not found");
    }
  };
  that.updateCompanyUserLock = async (req) => {
    const config = { ...req.body };
    await delCompanyUserLocks(config);
    return "update successfully";
  };
  that.updateCompanyUser = async (req) => {
    const config = { ...req.body };
    const id = config.id;
    delete config["id"];
    const result = await bussinessDB.runQuery({
      sql: `UPDATE tv_user SET ? WHERE id= ?`,
      values: [config, id]
    });
    return `update tv_user`;
  };

  that.getCompanyDeviceList = async (req) => {
    let whereStr = "WHERE 1 = 1 ";
    whereStr = whereStrGenerator(whereStr, req.query, {
      macID: "u.macid",
      company_name: "c.name",
      created_time: "u.created_time",
      mac_type: "e.type"
    });
    const sql = `SELECT u.*, c.name AS company_name, e.type AS mac_type FROM tv_mac u 
      LEFT JOIN tv_company c on u.company_id = c.id
      LEFT JOIN tv_mac_ext e ON u.id = e.maciid
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_mac u 
      LEFT JOIN tv_mac_ext e ON u.id = e.maciid
      LEFT JOIN tv_company c on u.company_id = c.id 
      ${whereStr}`;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };

  that.getCompanyPermission = async (req) => {
    const whereStr = whereStrGenerator("WHERE 1 = 1 ", req.query, {
      name: "cp.name",
      note: "cp.note",
      extra: "cp.extra",
      company_name: "c.name"
    });
    const sql = `SELECT cp.*,c.name as company_name FROM tv_company_permission cp 
    LEFT JOIN tv_company c ON c.id = cp.company_id 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_company_permission cp 
    LEFT JOIN tv_company c ON c.id = cp.company_id ${whereStr}`;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };

  that.getCompanyVersion = async (req) => {
    const whereStr = whereStrGenerator("WHERE cv.company_id=c.id ", req.query, {
      company_name: "c.name"
    });
    const sql = `SELECT c.name AS company_name,cv.* FROM tv_company_version cv, tv_company c  
     ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_company_version cv, tv_company c ${whereStr}`;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };

  that.getCompanyPermissionValue = async (req) => {
    const value = {};
    for (const permission in permissionValue) {
      const v = permissionValue[permission];
      value[permission] = v.name;
    }
    return value;
  };
  that.getCompanyVersionValue = async (req) => {
    return versionValue || {};
  };

  that.getCompanyUserPermission = async (req) => {
    const whereStr = whereStrGenerator("WHERE 1 = 1 ", req.query, {
      id: "u.id",
      company_id: "u.company_id",
      email: "u.email",
      phone: "u.phone",
      permission: "!ISNULL(ucpr.id)"
    });
    let permissionIdStr = "";
    if (req.query.options) {
      const { permissionId } = JSON.parse(req.query.options);
      if (permissionId) {
        permissionIdStr = `AND ucpr.company_permission_id='${permissionId}'`;
      }
    }
    const sql = `SELECT u.id,u.nickname,u.phone,u.email,!ISNULL(ucpr.id) AS permission FROM tv_user u 
    LEFT JOIN tv_user_company_permission_relation ucpr ON ucpr.user_id = u.id ${permissionIdStr}
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_user u 
    LEFT JOIN tv_user_company_permission_relation ucpr ON ucpr.user_id = u.id ${permissionIdStr}
     ${whereStr}`;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };

  that.updateCompanyPermission = async (req) => {
    const config = { ...req.body };
    const id = config.id;
    delete config["id"];
    if (id) {
      const result = await bussinessDB.runQuery({
        sql: `UPDATE tv_company_permission SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_company_permission`;
    } else {
      const level = permissionValue[config.name]?.level || 1;
      config.level = level;
      const result = await bussinessDB.runQuery({
        sql: `INSERT INTO tv_company_permission SET ? `,
        values: config
      });
      return `insert tv_company_permission`;
    }
  };

  that.updateCompanyVersion = async (req) => {
    const config = { ...req.body };
    const id = config.id;
    delete config["id"];
    if (id) {
      const result = await bussinessDB.runQuery({
        sql: `UPDATE tv_company_version SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_company_version`;
    } else {
      const result = await bussinessDB.runQuery({
        sql: `INSERT INTO tv_company_version SET ? `,
        values: config
      });
      return `insert tv_company_version`;
    }
  };

  that.updateCompanyUserPermission = async (req) => {
    const { user_id, company_permission_id, status } = req.body;
    if (status) {
      const result = await bussinessDB.runQuery({
        sql: `INSERT INTO tv_user_company_permission_relation SET ? `,
        values: { user_id, company_permission_id }
      });
      return true;
    } else {
      const result = await bussinessDB.runQuery({
        sql: `DELETE FROM tv_user_company_permission_relation WHERE user_id=? AND company_permission_id=? `,
        values: [user_id, company_permission_id]
      });
      return true;
    }
  };

  that.deleteCompanyPermission = async (id) => {
    await bussinessDB.runQuery({
      sql: `DELETE FROM tv_company_permission WHERE id = ?`,
      values: [id]
    });
    await bussinessDB.runQuery({
      sql: `DELETE FROM tv_user_company_permission_relation WHERE company_permission_id = ?`,
      values: [id]
    });
    return true;
  };

  that.deleteCompanyVersion = async (id) => {
    await bussinessDB.runQuery({
      sql: `DELETE FROM tv_company_version WHERE id = ?`,
      values: [id]
    });
    return true;
  };

  that.searchCompanyName = async (search) => {
    const { result } = await bussinessDB.runQuery({
      sql: "SELECT id,name AS value FROM tv_company WHERE id LIKE CONCAT('%',?,'%') OR name LIKE CONCAT('%',?,'%') LIMIT 20",
      values: [search, search]
    });
    return result || [];
  };

  that.getCompanyConnectionLog = async (req) => {
    const { connection_status } = JSON.parse(req.query.options);
    const whereStr = whereStrGenerator(
      `WHERE mc.company_id=c.id AND mc.connected_time IS NOT NULL ${connection_status
        ? `AND mc.disconnected_time ${connection_status == 0 ? ">" : "<="} "2021-01-01 08:00:00"`
        : ""
      }`,
      req.query,
      {
        name: "c.name",
        id: "mc.id",
        email: "mc.email",
      }
    );
    const sql = `SELECT c.name AS name, mc.*,
    SEC_TO_TIME(TIMESTAMPDIFF(SECOND, mc.connected_time, mc.disconnected_time)) AS time_spend 
    FROM tv_machine_connection mc, tv_company c ${SQLpostfixGenerator(
      whereStr,
      req.query
    )
      } `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_machine_connection mc, tv_company c ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.getCompanyConnectionLogCount = async (req) => {
    const whereStr = whereStrGenerator(
      "WHERE mc.company_id=c.id AND mc.connected_time IS NOT NULL ",
      req.query,
      {
        name: "c.name",
        id: "mc.id",
        email: "mc.email",
        connection_status: "!ISNULL(mc.disconnected_time)"
      }
    );
    const result = (
      await bussinessDB.runQuery({
        sql: `SELECT COUNT(DISTINCT(mc.company_id)) AS company_num,
    COUNT(DISTINCT(mc.email)) AS user_num,
      COUNT(DISTINCT(mc.tdid)) AS td_num,
        COUNT(DISTINCT(mc.to_tdid)) AS totd_num
      FROM tv_machine_connection mc, tv_company c ${SQLpostfixGenerator(
        whereStr,
        req.query
      )} `
      })
    ).result;
    return result;
  };
  that.getCompanyLoginLog = async (req) => {
    return { list: [], total: 0 };
  };

  that.getGpuList = async (req) => {
    let whereStr = "WHERE test_result=3 ";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM tv_gpu_collect 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_gpu_collect ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.getGpuWhitelist = async (req) => {
    let whereStr = "WHERE 1 = 1 ";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM tv_gpu_white_list 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM tv_gpu_white_list ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.deleteGpuWhitelist = async (id) => {
    const { result } = await bussinessDB.runQuery({
      sql: `UPDATE tv_gpu_white_list SET status = 0 WHERE id =? `,
      values: [id]
    });
    return result;
  };
  that.updateGpuWhitelist = async (req) => {
    const config = { ...req.body };
    const id = config.id;
    delete config["id"];
    if (id) {
      const result = await bussinessDB.runQuery({
        sql: `UPDATE tv_gpu_white_list SET ? WHERE id = ? `,
        values: [config, id]
      });
      return `update tv_gpu_white_list, result: ${result} `;
    } else {
      try {
        const result = await bussinessDB.runQuery({
          sql: `INSERT INTO tv_gpu_white_list SET ? `,
          values: config
        });
        return `insert tv_gpu_white_list, result: ${result} `;
      } catch (error) {
        if (error.code == "ER_DUP_ENTRY") {
          throw new Error("白名单已存在");
        }
        throw error;
      }
    }
  };

  that.getGhostBlackList = async (req) => {
    const result = await getConflict();
    return {
      list: result.map((v, index) => {
        const [uuid, guid] = v.split("_");
        return { index, uuid, guid };
      }),
      total: result.length
    };
  };
  that.deleteGhostBlackList = async (req) => {
    const { uuid, guid } = req.body;
    await delConflict(`${uuid}_${guid} `);
    return true;
  };
  that.addGhostBlackList = async (req) => {
    const { uuid, guid } = req.body;
    await addConflict(`${uuid}_${guid} `);
    return true;
  };

  const usernameWhiteList = [
    "wangzhengwei",
    "wushenli",
    "linhuihao",
    "wanghe",
    "yegengyuan",
    "hujianqiang",
    "zhumin",
    "dongguangwei",
    "lirichu",
    "baipengyan",
    "houalin",
    "jiangzhihao",
    "lixiaomin",
    "xingyujie"
  ];
  that.getCompanyOrder = async (req) => {
    let whereStr = `WHERE 1 = 1`;
    const { username } = req.user;
    if (!usernameWhiteList.includes(username)) {
      whereStr += ` AND operator_name = '${username}' `;
    }
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, company_id, company_name, combo_name, start_time, end_time, create_time,
    operator_name, total_amount, status, order_type
     FROM tv_order
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_order
    ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.getCompanyOrderCount = async (req) => {
    let whereStr = `WHERE 1 = 1`;
    const { username } = req.user;
    if (!usernameWhiteList.includes(username)) {
      whereStr += ` AND operator_name = '${username}' `;
    }
    whereStr = whereStrGenerator(whereStr, req.query);
    const result = (
      await bussinessDB.runQuery({
        sql: `SELECT SUM(total_amount) AS sum_total_amount,
    SUM(coupon_amount) AS sum_coupon_amount,
      SUM(pay_amount) AS sum_pay_amount
      FROM tv_order
     ${SQLpostfixGenerator(whereStr, req.query)} `
      })
    ).result;
    return result;
  };
  that.getCompanyOrderByID = async (req) => {
    /**      SELECT CONCAT('{',GROUP_CONCAT('"',name,'":"',numbers,'"'),'}')
        FROM tv_company_permission 
        WHERE company_id=36 AND id in (
          SELECT max(id) id 
          FROM tv_company_permission 
          WHERE company_id=o.company_id
          GROUP BY company_id,name
      ) AS productPermissions */
    const orderDetails = (
      await bussinessDB.runQuery({
        sql: `SELECT o.*,
    CONCAT('{', GROUP_CONCAT('"', i.product_name, '":"', i.product_quantity, '"'), '}') AS productDetails
      FROM tv_order AS o
      LEFT JOIN tv_order_item AS i ON o.id = i.order_id
      WHERE o.id = '${req.params.id}'`
      })
    ).result;
    return orderDetails;
  };

  that.getCompanyOrdersByCompanyID = async (req) => {
    const orderDetails = (
      await bussinessDB.runQuery({
        sql: `SELECT MIN(start_time) AS min_start_time, MAX(end_time) AS max_end_time
        FROM tv_order WHERE company_id = ${req.params.id} AND status IN(1, 2)`
      })
    ).result;
    return orderDetails;
  };

  const insertOrderItems = async (
    insertResult,
    packageDetails,
    productDetails
  ) => {
    // 生成有个数的商品的insert SQL
    let sql = "";
    for (const key in productDetails) {
      sql += `INSERT INTO tv_order_item SET
  order_id = ${insertResult.insertId},
  order_sn = '${packageDetails.order_sn}',
    product_id = (SELECT id FROM tv_bussiness_product WHERE name = '${key}'),
  product_name = '${key}',
    product_quantity = ${productDetails[key]};
  `;
    }
    return await bussinessDB.runQuery({ sql });
  };
  const setOperator = async (packageDetails, req) => {
    if (packageDetails.operator_name && !packageDetails.operator_id) {
      const adminResult = (
        await adminDB.runQuery({
          sql: `SELECT id FROM ums_admin WHERE username = '${packageDetails.operator_name}'`
        })
      ).result;
      const adminID = adminResult.length > 0 ? adminResult[0].id : 0;
      packageDetails = {
        operator_id: adminID,
        order_sn: snGenerator(adminID),
        ...packageDetails
      };
    } else if (packageDetails.operator_name && packageDetails.operator_id) {
      packageDetails = {
        order_sn: snGenerator(packageDetails.operator_id),
        ...packageDetails
      };
    } else {
      let { id: userid, username } = req.user;
      packageDetails = {
        operator_id: userid,
        operator_name: username,
        order_sn: snGenerator(userid),
        ...packageDetails
      };
    }
    return packageDetails;
  };
  const insertOrder = async (packageDetails, productDetails) => {
    await isValidNewOrder(packageDetails);
    // 新建订单
    packageDetails = {
      status: 1,
      order_type: 0,
      ...packageDetails
    };
    const insertResult = (
      await bussinessDB.runQuery({
        sql: `INSERT INTO tv_order SET ? `,
        values: packageDetails
      })
    ).result;
    await insertOrderItems(insertResult, packageDetails, productDetails);
    return insertResult;
  };
  const isValidNewOrder = async (packageDetails) => {
    const { company_id, start_time, end_time } = packageDetails;
    const orderDetails = (
      await bussinessDB.runQuery({
        sql: `SELECT MIN(start_time) AS min_start_time, MAX(end_time) AS max_end_time
        FROM tv_order WHERE company_id = ${company_id} AND status IN(1, 2)`
      })
    ).result[0];
    console.warn(
      moment(start_time).format("YYYY-MM-DD HH:mm:ss"),
      moment(end_time).format("YYYY-MM-DD HH:mm:ss"),
      moment(orderDetails.min_start_time).local().format("YYYY-MM-DD HH:mm:ss"),
      moment(orderDetails.max_end_time).local().format("YYYY-MM-DD HH:mm:ss")
    );
    if (
      orderDetails.min_start_time &&
      moment(end_time).unix() >=
        moment(orderDetails.min_start_time).local().unix() &&
      orderDetails.max_end_time &&
      moment(start_time).unix() <=
        moment(orderDetails.max_end_time).local().unix()
    ) {
      throw new Error("新订单时间范围与已有订单时间范围有重叠");
    }
  };
  that.importCompanyOrder = async (req) => {
    try {
      let { packageDetails, productDetails } = req.body;
      packageDetails = await setOperator(packageDetails, req);
      const insertResult = await insertOrder(packageDetails, productDetails);
      return insertResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  that.updateCompanyOrder = async (req) => {
    try {
      let { packageDetails, productDetails } = req.body;
      let id = packageDetails.id;
      delete packageDetails["id"];
      let { id: userid, username } = req.user;
      packageDetails = {
        operator_id: userid,
        operator_name: username,
        order_sn: snGenerator(userid),
        ...packageDetails
      };
      let insertResult, insertItemResult;
      if (id) {
        // 修改订单时，生成一个新的有效订单，并将原订单设为关闭
        const oldOrder = (
          await bussinessDB.runQuery({
            sql: `SELECT * FROM tv_order WHERE id = ${id} `
          })
        ).result[0];
        if (!oldOrder || !isEffectiveOrder(oldOrder)) {
          throw new Error("订单已超时或已关闭");
        }
        packageDetails = {
          status: 1,
          order_type: 1,
          ...packageDetails
        };
        insertResult = (
          await bussinessDB.runQuery({
            sql: `INSERT INTO tv_order SET ? `,
            values: packageDetails
          })
        ).result;
        insertItemResult = await insertOrderItems(
          insertResult,
          packageDetails,
          productDetails
        );
        const { result: stopResult } = await bussinessDB.runQuery({
          sql: `UPDATE tv_order SET ? WHERE id = ? `,
          values: [{ status: 4 }, id]
        });
      } else {
        insertResult = await insertOrder(packageDetails, productDetails);
      }
      return insertResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  // 测试上面的接口
  // this.updateCompanyOrder({
  //   user: { id: 999, username: 'test' },
  //   body: {
  //     packageDetails: {
  //       combo_name: "企业远程办公基础版",
  //       company_id: 2123123,
  //       company_name: "示例企业_zuler_demo_1",
  //       currency_type: "CNY",
  //       discount_amount: 0,
  //       end_time: "2022-08-26 00:00:00",
  //       id: undefined,
  //       note: "",
  //       pay_amount: 666,
  //       start_time: "2022-08-10 00:00:00",
  //       total_amount: 1235,
  //     }, productDetails: {
  //       allowClearWatermark: true,
  //       allowInvisibleWatermark: true,
  //       allowTempUser: true,
  //       loginPlatform: ["windows", "mac", "linux", "android", "ios"],
  //       max444UserNumber: 0,
  //       maxChannelNumber: 10,
  //       maxDeviceGroupNumber: 20,
  //       maxDeviceNumber: 200,
  //       maxMultiScreensUserNumber: 0,
  //       maxPerformanceUserNumber: 0,
  //       maxRecordDateRange: 3,
  //       maxRecordSpace: 0,
  //       maxRoleNumber: 20,
  //       maxSupportUserNumber: 0,
  //       maxUserGroupNumber: 20,
  //       maxUserNumber: 20
  //     }
  //   }
  // });

  that.changeCompanyOrderStatus = async (req) => {
    let orderDetails = req.body;
    let id = orderDetails.id;
    delete orderDetails["id"];
    let updateResult;
    if (orderDetails.status == 2) {
      // 激活订单
      updateResult = await bussinessDB.runQuery({
        sql: `UPDATE tv_order SET ? WHERE id = ? `,
        values: [orderDetails, id]
      });
      // TODO:激活订单及其对应功能
    } else {
      // 停止订单
      updateResult = await bussinessDB.runQuery({
        sql: `UPDATE tv_order SET ? WHERE id = ? `,
        values: [orderDetails, id]
      });
      // TODO:停止订单及其对应功能
    }
    return updateResult;
  };

  that.getCompanyListSimple = async (req) => {
    const { nameORid } = JSON.parse(req.query.options);
    let whereStr = `WHERE status = 1 ${
      nameORid ? `AND (name LIKE '%${nameORid}%' OR id = '${nameORid}')` : ""
    }`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_company
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_company
    ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };

  that.getMD5List = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM tv_client_md5 ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_client_md5 ${whereStr} `;
    return getListBySQL(sql, getCountSql, bussinessDB);
  };
  that.getMD5ByID = async (req) => {
    return (
      await bussinessDB.runQuery({
        sql: `SELECT * FROM tv_client_md5 WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.deleteMD5 = async (id) => {
    const { result } = await bussinessDB.runQuery({
      sql: `DELETE FROM tv_client_md5 WHERE id = '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateMD5 = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await bussinessDB.runQuery({
        sql: `UPDATE tv_client_md5 SET ? WHERE id = ? `,
        values: [config, id]
      });
      return `update tv_client_md5, result: ${result} `;
    } else {
      let result = await bussinessDB.runQuery({
        sql: `INSERT INTO tv_client_md5 SET ? `,
        values: config
      });
      return `insert tv_client_md5, result: ${result} `;
    }
  };

  return that;
}

module.exports = new model();
