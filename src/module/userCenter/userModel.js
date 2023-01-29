const mysql = require("../common/mysql");
const api = require("./api")();
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const moment = require("moment");
const mySqlConn = mysql({ dbname: "center", multipleStatements: true });
const ums_mySqlConn = mysql({ dbname: "admin" });
const { client: umsRedis } = require("../common/redis/umsRedis");
const { client: dredis } = require("../common/redis/dredis");
const { client: uredis } = require("../common/redis/uRedis");
const redisMap = {
  guid_uuid_conflict: dredis,
  tv_connection_mac: dredis,
  tdidblacklistx: dredis,
  tdidblackuserlistx: dredis,
  business_blist_uid: dredis,
  business_blist_tdid: dredis
};
const { sendCustomMail } = require("../configurationCenter/api");
const { CHANGE_USERPHONE_MAILTO, REFUND_APPLY_MAILTO, REFUND_APPLY_CC } =
  process.env;

function userModel() {
  let that = this;
  that.getUserList = async (req) => {
    /**
     *  A legal full function SQL example:
     *  SELECT id,nickname,passcode,phone,regdate,viplevel,access,email,is_delete,delete_time FROM tv_user
     */
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id,nickname,phone,regdate,viplevel,access,email,is_delete,delete_time,fid 
        FROM tv_user INNER JOIN (SELECT id FROM tv_user 
        ${SQLpostfixGenerator(whereStr, req.query)}) b USING (id) `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_user ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getMacList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_mac ${SQLpostfixGenerator(
      whereStr,
      req.query
    )}`;
    let getCountSql = `SELECT COUNT(1) AS total FROM tv_mac as m ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getMacExtByMacID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_mac_ext WHERE macid = '${req.params.id}'`
      })
    ).result[0];
  };

  that.getMachineList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_macine ${SQLpostfixGenerator(
      whereStr,
      req.query
    )}`;
    let getCountSql = `SELECT COUNT(1) AS total FROM tv_macine as m ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getPlanList = async (req) => {
    /** 
     *  A legal full function SQL example:
     *  SELECT u.nickname, u.phone, u.email, p.*
        FROM tv_package as p 
        JOIN tv_user as u on p.userid=u.id 
      */
    let whereStr = "WHERE (apply_effective != 0 OR apply_effective IS NULL)";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT u.nickname, u.phone, u.email, u.viplevel, p.*, 
        a.applyid, a.apply_state, a.apply_effective, a.apply_type
        FROM tv_package as p 
        JOIN tv_user as u on p.userid=u.id 
        LEFT JOIN tv_application as a on p.userid=a.apply_userid
        ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(userid) AS total
        FROM tv_package as p 
        JOIN tv_user as u on p.userid=u.id 
        LEFT JOIN tv_application as a on p.userid=a.apply_userid
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getTryPlanList = async (req) => {
    let whereStr = "WHERE 1=1 AND status = 1";
    whereStr = whereStrGenerator(whereStr, req.query, {
      id: "t.id",
      phone: "u.phone"
    });
    let sql = `SELECT t.*, u.phone 
        FROM tv_try_function_config AS t
        LEFT JOIN tv_user AS u ON t.userid=u.id
         ${SQLpostfixGenerator(whereStr, req.query, {
      id: "t.id",
      phone: "u.phone"
    })} `;
    let getCountSql = `SELECT COUNT(t.id) AS total 
    FROM tv_try_function_config AS t
    LEFT JOIN tv_user AS u ON t.userid=u.id
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getWechatUserList = async (req) => {
    /** 
      *  A legal full function SQL example:
      *  SELECT u.nickname, u.phone, u.email, w.*
         FROM tv_wechat_user as w
         LEFT JOIN tv_user as u on w.userid=u.id 
      */
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query, {
      nickname: "w.nickname"
    });
    let sql = `SELECT u.phone, u.email, w.*
        FROM tv_wechat_user as w
        LEFT JOIN tv_user as u on w.userid=u.id 
        ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(userid) AS total
        FROM tv_wechat_user as w
        LEFT JOIN tv_user as u on w.userid=u.id 
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getOrderList = async (req) => {
    /**
     *  A legal full function SQL example:
     *  SELECT id,userid,phone,meal_type,passive_num,endtime,viplevel,total_price,actual_price,trade_id,trade_name,create_time,is_invoice
     *  FROM tv_order_buy LIMIT ?,?
     */
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query, {
      userphone: "u.phone",
      id: "o.id"
    });
    let sql = `SELECT o.*, u.phone AS userphone
        FROM tv_order_buy AS o
        LEFT JOIN tv_user AS u ON o.userid=u.id
         ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(userid) AS total 
        FROM tv_order_buy AS o
        LEFT JOIN tv_user AS u ON o.userid=u.id
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getInvoiceList = async (req) => {
    /** 
      *  A legal full function SQL example:
      *  SELECT i.*, u.phone, u.nickname
        FROM tv_invoice as i 
        JOIN tv_user as u on i.userid=u.id
      */
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query, {
      id: "i.id",
      email: "i.email",
      userid: "i.userid",
      phone: "u.phone",
      state: "i.state",
      pay_time: "o.pay_time"
    });
    let sql = `SELECT i.*, u.phone, u.nickname, o.pay_time
        FROM tv_invoice as i 
        JOIN tv_order_buy as o on i.order_id=o.id
        JOIN tv_user as u on i.userid=u.id
        ${SQLpostfixGenerator(whereStr, req.query)}`;
    let getCountSql = `SELECT COUNT(*) AS total 
        FROM tv_invoice as i 
        JOIN tv_order_buy as o on i.order_id=o.id
        JOIN tv_user as u on i.userid=u.id
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getMainUserList = async (req) => {
    /**
     *  A legal full function SQL example:
     *  SELECT id,nickname,passcode,phone,regdate,viplevel,access,email,is_delete,delete_time FROM tv_user
     */
    let whereStr = "WHERE fid = 0";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id,nickname,phone,regdate,viplevel,access,email,is_delete,delete_time,fid 
        FROM tv_user ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_user ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getChildUserList = async (userid) => {
    /**
     *  A legal full function SQL example:
     *  SELECT id,nickname,phone,regdate,viplevel,access,email,is_delete,delete_time,fid FROM tv_user
     */
    let whereStr = `WHERE fid = ${userid}`;
    let sql = `SELECT id,nickname,phone,regdate,viplevel,access,email,is_delete,delete_time,fid FROM tv_user ${whereStr}`;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_user ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getOemList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT o.*, u.phone, u.nickname, u.email
        FROM tv_oem as o 
        JOIN tv_user as u on o.userid=u.id
        ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(userid) AS total 
        FROM tv_oem as o 
        JOIN tv_user as u on o.userid=u.id
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getIOSUserList = async (req) => {
    let whereStr = "WHERE 1=1";
    const { userid, phone, email, ios_email } =
      JSON.parse(req.query?.options || "{}").filter || {};
    if (!(userid || phone || email || ios_email)) {
      throw new Error("查询条件条件不满足");
    }
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT u.nickname, u.phone, u.email, u.viplevel, w.*
        FROM tv_ios_user as w
        LEFT JOIN tv_user as u on w.userid=u.id 
        ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(*) AS total
        FROM tv_ios_user as w
        LEFT JOIN tv_user as u on w.userid=u.id 
        ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getControlledOrderList = async (req) => {
    /**
     *  A legal full function SQL example:
     *  SELECT id,userid,phone,controlled_num,actual_price,total_price,
                    total_fee,create_time,pay_time,expire_time, pay_type,trade_id,prepay_id,
                    trade_name,ali_trade_no,transaction_id,trade_status,notify_id,ip,state,del_machine
        FROM tv_controlled_order
      */
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id,userid,phone,controlled_num,actual_price,total_price,
                        total_fee,create_time,pay_time,expire_time, pay_type,trade_id,prepay_id,
                        trade_name,ali_trade_no,transaction_id,trade_status,notify_id,ip,state,del_machine
            FROM tv_controlled_order ${SQLpostfixGenerator(
      whereStr,
      req.query
    )}`;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_controlled_order ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getMachineAliasList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT u.nickname, u.phone, u.email, m.*
        FROM tv_macine_alias as m 
        LEFT JOIN tv_user as u on m.userid=u.id
        ${SQLpostfixGenerator(whereStr, req.query)}`;
    let getCountSql = `SELECT COUNT(1) AS total FROM tv_macine_alias as m ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getMD5List = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM tv_client_md5 ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_client_md5 ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getMD5ByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_client_md5 WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.deleteMD5 = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM tv_client_md5 WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateMD5 = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_client_md5 SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_client_md5, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_client_md5 SET ? `,
        values: config
      });
      return `insert tv_client_md5, result: ${result}`;
    }
  };

  that.getProductList = async (req) => {
    let { productType } = JSON.parse(req.query.options);
    let whereStr = "WHERE 1=1";
    if (productType == "1") {
      whereStr = whereStr + " and type = 1";
    } else {
      whereStr = whereStr + " and type > 1";
    }

    whereStr = whereStrGenerator(whereStr, req.query);

    let sql = `select u.* 
                from (
                    select t1.*
                from todesk_admin.ums_product_temp t1
                where 1 > (
                    select count(*)
                    from todesk_admin.ums_product_temp t2 
                    where t2.type = t1.type and t2.type_level = t1.type_level and t2.vip_limits = t1.vip_limits and t2.version > t1.version 
                )
                order by t1.type ,t1.type_level,t1.vip_limits,t1.version desc
                                ) u
        ${SQLpostfixGenerator(whereStr, req.query)}`;

    let getCountSql = `SELECT COUNT(1) AS total 
                        FROM (
                            select t1.*
                        from todesk_admin.ums_product_temp t1
                        where 1 > (
                            select count(*)
                            from todesk_admin.ums_product_temp t2 
                            where t2.type = t1.type and t2.type_level = t1.type_level and t2.vip_limits = t1.vip_limits and t2.version > t1.version 
                        )
                        order by t1.type ,t1.type_level,t1.vip_limits,t1.version desc) m 
                        ${whereStr}`;

    let { list, total } = await getListBySQL(sql, getCountSql, ums_mySqlConn);

    list.forEach((element) => {
      if (element.params) {
        element.params = JSON.parse(element.params);
      }
    });

    return { list, total };
  };

  that.insertProduct = async (product) => {
    let sql = "INSERT INTO todesk_admin.ums_product_temp set ?";
    let { result } = await ums_mySqlConn.runQuery({
      sql,
      values: product
    });
    return result;
  };

  that.insertPublishProduct = async (product) => {
    let sql = "INSERT INTO tv_product set ?";
    let { result } = await mySqlConn.runQuery({
      sql,
      values: product
    });
    return result;
  };

  that.getbyProductId = async (productId) => {
    let sql = "SELECT * FROM todesk_admin.ums_product_temp where id = ?";

    let { result } = await ums_mySqlConn.runQuery({
      sql,
      values: [productId]
    });
    return result[0];
  };

  that.getProductVersionRecords = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);

    let sql = `select *
               from todesk_admin.ums_product_temp
        ${SQLpostfixGenerator(whereStr, req.query)}`;

    let getCountSql = `
                        SELECT COUNT(1) AS total
                        from todesk_admin.ums_product_temp
                        ${whereStr}`;

    let { list, total } = await getListBySQL(sql, getCountSql, ums_mySqlConn);

    list.forEach((element) => {
      if (element.params) {
        element.params = JSON.parse(element.params);
      }
    });
    return { list, total };
  };

  that.getLatestVersionProduct = async (type, type_level, vip_limits) => {
    let sql = `select *
          from todesk_admin.ums_product_temp
          where id = (
          select id
          from todesk_admin.ums_product_temp
          where type = ? and type_level = ? and vip_limits = ?
          order by version desc
          limit 0,1
          ) `;
    let { result } = await ums_mySqlConn.runQuery({
      sql,
      values: [type, type_level, vip_limits]
    });
    return result[0];
  };

  that.searchUser = async (data) => {
    const { result } = await mySqlConn.runQuery({
      sql: "SELECT * FROM tv_user WHERE phone = ? OR email = ? OR id = ? LIMIT 20",
      values: [data.emailphoneid, data.emailphoneid, data.emailphoneid]
    });
    return result || [];
  };
  const getAndroidControlDetail = async (userid) => {
    const uRedisResult = await uredis.get(
      `ctl_${userid}_${moment().format("YYYY-MM")}`
    );
    let changeLog = uRedisResult ? JSON.parse(uRedisResult) : null;
    if (changeLog) {
      changeLog.macid = changeLog.macid.split('|')
      const tempChangeLogList = (
        await mySqlConn.runQuery({
          sql: changeLog.macid
            .map((macid) => `SELECT * FROM tv_mac WHERE macid = '${macid}';`)
            .join("")
        })
      ).result;
      changeLog.list = Array.isArray(tempChangeLogList[0])
        ? tempChangeLogList.filter(item => item.length > 0).map(item => item[0])
        : tempChangeLogList;
      // changeLog.list = changeLog.macid.map(async (item) => {
      //   return (
      //     await mySqlConn.runQuery({
      //       sql: `SELECT * FROM tv_mac WHERE macid = '${item}'`
      //     })
      //   ).result;
      // })
      // changeLog.list = (
      //   await mySqlConn.runQuery({
      //     sql: `SELECT * FROM tv_mac
      //       WHERE macid IN ('${changeLog.macid.join("','")}')`
      //   })
      // ).result;
    }
    const androidControlResult = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_mac
          WHERE macid IN (SELECT macid
          FROM tv_android_controlled
          WHERE userid = ${userid})`
      })
    ).result;
    const functionConfigResult = (
      await mySqlConn.runQuery({
        sql: `SELECT SUM(value) AS sum_value
          FROM tv_function_config
          WHERE userid = ${userid} AND type = 4 
          AND start_time <= ${moment().unix()} AND end_time >= ${moment().unix()}`
      })
    ).result[0];
    const tryFunctionConfigResult = (
      await mySqlConn.runQuery({
        sql: `SELECT SUM(value) AS sum_value
          FROM tv_try_function_config
          WHERE userid = ${userid} AND type = 4 
          AND start_time <= ${moment().unix()} AND end_time >= ${moment().unix()}`
      })
    ).result[0];
    const capcity =
      functionConfigResult?.sum_value ||
      0 + tryFunctionConfigResult?.sum_value ||
      0;
    const androidControlDetails = {
      capcity,
      changeLogList: changeLog?.list || [],
      changeLogMacs: changeLog?.macid || [],
      changeNum: changeLog?.num || 0,
      currentMacList: androidControlResult
    };
    return androidControlDetails;
  };
  this.searchUserDetail = async (data) => {
    if (data.type === 'userInfo') {
      let iOSUserInfo = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_ios_user
          WHERE userid = '${data.userid}'`
        })
      ).result;
      let wechatUserInfo = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_wechat_user
          WHERE userid = '${data.userid}'`
        })
      ).result;
      return { iOSUserInfo, wechatUserInfo };
    }
    if (data.type === 'productList') {
      let publicInfo = await api.getUserPublicInfo({
        userid: data.userid
      });
      let spuIdMap = (
        await mySqlConn.runQuery({
          sql: `SELECT id, name FROM tv_product_spu`
        })
      ).result;
      return { publicInfo, spuIdMap };
    }
    if (data.type === 'newOrder') {
      let newOrderList = (
        await mySqlConn.runQuery({
          sql: `SELECT id, userid, coupon_id, order_type, trade_id, total_price, 
          total_fee, start_time, end_time, pay_status, pay_time, old_order_id , is_refund, create_time
          FROM tv_bill_order
          WHERE userid = '${data.userid}'`
        })
      ).result;
      return { newOrderList };
    }
    if (data.type === 'deviceGroup') {
      let machineList = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_macine
                  WHERE user = '${data.userid}'`
        })
      ).result;
      let groupList = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_group
                  WHERE userid = '${data.userid}'`
        })
      ).result;

      return { machineList, groupList };
    }
    if (data.type === 'registrationRecord') {
      const userLoginList = await api.getUserLoginList(data);
      return { userLoginList };
    }
    if (data.type === 'connectionRecord') {
      const userConnList = await api.getUserConnList(data);
      return { userConnList };
    }
    if (data.type === 'androidList') {
      const androidControlDetails = await getAndroidControlDetail(data.userid);
      return { androidControlDetails };
    }
  };
  // that.searchUserDetail({ userid: 371531 })
  that.sendUpgradeUserCode = async (req) => {
    if (!REFUND_APPLY_MAILTO || !REFUND_APPLY_CC) {
      throw new Error("未配置接收验证码的邮箱!");
    }
    const { userid, reason } = req.body;
    const code = Math.random().toString().slice(-6);
    const redisResult = await umsRedis.set(
      `upgradeApply:${userid}`,
      code,
      "EX",
      604800
    );
    if (redisResult == "OK") {
      const userResult = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_user WHERE id = ${userid}`
        })
      ).result[0];
      const data = {
        mailto: REFUND_APPLY_MAILTO.split(","),
        cc: REFUND_APPLY_CC.split(","),
        title: "个人版用户升级申请",
        content: `Dear all,
        <br/> 现申请个人版用户升级/添加功能，请leader审批
        <br/> 操作客服： ${req.user.username} 
        <br/> 升级理由：${reason}
        <br/> 
        <br/> 用户ID：  ${userid}
        ${userResult.phone ? `<br/> 手机号：    ${userResult.phone}` : ""}
        ${userResult.email ? `<br/> 邮箱：    ${userResult.email}` : ""}
        <br/>
        <br/> 同意后，请通知相关客服在运营后台输入验证码 ${code} 进行确认。
        `
      };
      const mailResult = await sendCustomMail(data);
      if (!mailResult || JSON.parse(mailResult).code != "200") {
        throw new Error("发送邮件失败!");
      }
    } else {
      throw new Error("umsRedis写入出错");
    }
    return `验证码已发送至管理员邮箱: ${REFUND_APPLY_MAILTO.split(
      ","
    )}, 请在7天内完成验证.`;
  };

  that.upgradeUser = async (req) => {
    try {
      const {
        userid,
        spuId,
        amount,
        desc = "手动添加",
        day,
        actualPrice = 0,
        orderType,
        code,
        trade_id,
        macid
      } = req.body;
      const redisCode = await umsRedis.get(`upgradeApply:${userid}`);
      if (redisCode * 1 == code * 1) {
        const upgradeResult = await api.generateOrder({
          userid,
          spuId,
          amount,
          desc,
          day,
          actualPrice,
          orderType,
          trade_id,
          macid
        });
        if (upgradeResult?.code == 200) {
          return "升级成功";
        } else {
          throw new Error(`升级接口返回错误:${upgradeResult?.code || ""}`);
        }
      } else {
        throw new Error("验证码错误!");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  that.getNewOrder = async (req) => {
    const { product, phoneOrEmail } = JSON.parse(req.query.options);
    let whereStr = `WHERE 1=1 
    ${product?.length > 0
        ? `AND id IN (SELECT DISTINCT(order_id) FROM tv_bill_order_detail WHERE product_id IN ("${product.map(i => i[1]).join('","')}"))`
        : ""} 
      ${phoneOrEmail
        ? `AND userid IN (SELECT id FROM tv_user WHERE phone = ${phoneOrEmail} OR email = ${phoneOrEmail})`
        : ""}`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, userid, coupon_id, order_type, trade_id, total_price, platform, 
    total_fee, start_time, end_time, pay_status, pay_time, old_order_id , is_refund, create_time
    FROM tv_bill_order
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_bill_order
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getNewOrderCSV = async (req) => {
    const { product } = JSON.parse(req.query.options);
    let whereStr = `WHERE 1=1 ${product?.length > 0
      ? `AND o.id IN (SELECT DISTINCT(order_id) FROM tv_bill_order_detail WHERE product_id IN ("${product.map(i => i[1]).join('","')}"))`
      : ""}`;
    whereStr = whereStrGenerator(whereStr, req.query, {
      id: "o.id",
      create_time: "o.create_time",
      status: "o.status",
      userid: "o.userid",
      start_time: "o.start_time",
      end_time: "o.end_time",
      pay_time: "o.pay_time",
      order_type: "o.order_type"
    });
    let sql = `SELECT o.id, o.userid, o.new_coupon_id, o.coupon_id, o.order_type, o.trade_id, o.total_price, o.channel,
    o.invoice_id, o.total_fee, o.start_time, o.end_time, o.pay_status, o.pay_time, o.old_order_id , o.is_refund, 
    o.platform, o.create_time,
    (SELECT name FROM tv_product p WHERE p.id = d.product_id) AS product_name, d.total_fee AS product_total_fee,
    d.charge_type AS product_charge_type,
    i.price AS invoice_price, i.rise_type AS invoice_rise_type, i.rise_name AS invoice_rise_name,
    i.email AS invoice_email, i.rise_num AS invoice_rise_num, i.state AS invoice_state,
    i.reason AS invoice_reason, i.createtime AS invoice_createtime, i.is_deleted AS invoice_is_deleted
    FROM tv_bill_order o 
    RIGHT JOIN tv_bill_order_detail d ON o.id = d.order_id
    LEFT JOIN tv_bill_pay_result r ON r.id = o.trade_id
    LEFT JOIN tv_invoice i ON o.invoice_id = i.id
    ${SQLpostfixGenerator(whereStr, req.query, {
      id: "o.id",
      create_time: "o.create_time",
      status: "o.status",
      userid: "o.userid",
      start_time: "o.start_time",
      end_time: "o.end_time",
      pay_time: "o.pay_time"
    })} `;
    let getCountSql = `SELECT COUNT( o.id ) AS total FROM tv_bill_order o
    RIGHT JOIN tv_bill_order_detail d ON o.id = d.order_id
    LEFT JOIN tv_bill_pay_result r ON r.id = o.trade_id
    LEFT JOIN tv_invoice i ON o.invoice_id = i.id
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getNewOrderByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT o.*,
        i.price AS invoice_price, i.rise_type AS invoice_rise_type, i.rise_name AS invoice_rise_name,
        i.email AS invoice_email, i.rise_num AS invoice_rise_num, i.state AS invoice_state,
        i.reason AS invoice_reason, i.createtime AS invoice_createtime, i.is_deleted AS invoice_is_deleted,
        u.phone AS user_phone, u.email AS user_email, u.nickname AS user_nickname,
        w.unionid AS wechat_unionid
        FROM tv_bill_order o
        LEFT JOIN tv_invoice i ON o.invoice_id = i.id
        LEFT JOIN tv_user u ON o.userid = u.id
        LEFT JOIN tv_wechat_user w ON o.userid = w.userid
        WHERE o.id = '${req.params.id}'`
      })
    ).result;
  };
  that.getNewOrderPayResultByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT id, params, create_time
        FROM tv_bill_pay_result WHERE order_id = '${req.params.id}'`
      })
    ).result;
  };
  that.getNewOrderDetailsByOrderID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT d.*, p.name AS product_name, p.platform AS product_platform,
        (SELECT name FROM tv_product_spu WHERE id = p.f_spu_id) AS product_f_spu_name
        FROM tv_bill_order_detail d
        LEFT JOIN tv_product p ON d.product_id = p.id
        WHERE d.order_id = '${req.params.id}'`
      })
    ).result;
  };
  that.getNewOrderDetailByDetailID = async (req) => {
    let orderDetailResult = (
      await mySqlConn.runQuery({
        sql: `SELECT d.*, p.name AS product_name, p.platform AS product_platform, p.spu_id AS product_spu_id,
        (SELECT name FROM tv_product_spu WHERE id = p.spu_id) AS product_spu_name,
        (SELECT name FROM tv_product_spu WHERE id = p.f_spu_id) AS product_f_spu_name
        FROM tv_bill_order_detail d
        LEFT JOIN tv_product p ON d.product_id = p.id
        WHERE d.id = '${req.params.id}'`
      })
    ).result[0];
    let result = { orderDetailResult };
    return result;
  };
  that.getNewProductForNewOrderFilter = async (req) => {
    const spuResult = (
      await mySqlConn.runQuery({
        sql: `SELECT name, id FROM tv_product_spu WHERE status = 1 ORDER BY type ASC, type_level ASC, id ASC`
      })
    ).result;
    const productResult = (
      await mySqlConn.runQuery({
        sql: `SELECT id, name, (SELECT name FROM tv_product_spu s WHERE s.id = f_spu_id) AS f_spu_name,
        platform, spu_id, is_concurrency
        FROM tv_product WHERE status = 1 ORDER BY spu_id ASC, id ASC`
      })
    ).result;
    return {
      spuResult,
      productResult
    };
  };
  that.sendRefundNewOrderCode = async (req) => {
    if (!REFUND_APPLY_MAILTO || !REFUND_APPLY_CC) {
      throw new Error("未配置接收验证码的邮箱!");
    }
    const { userid, reason, id: id } = req.body;
    const code = Math.random().toString().slice(-6);
    const redisResult = await umsRedis.set(
      `refundApply:${id}`,
      code,
      "EX",
      604800
    );
    if (redisResult == "OK") {
      const userResult = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_user WHERE id = ${userid}`
        })
      ).result[0];
      const orderResult = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_bill_order WHERE id = ${id}`
        })
      ).result[0];
      const data = {
        mailto: REFUND_APPLY_MAILTO.split(","),
        cc: REFUND_APPLY_CC.split(","),
        title: "个人版用户退款申请",
        content: `Dear all,
        <br/> 现申请个人版用户退款，请leader审批
        <br/> 操作客服： ${req.user.username} 
        <br/> 退款理由：${reason}
        <br/> 
        <br/> 退款订单详情：
        <br/> 用户ID：  ${userid}
        ${userResult.phone ? `<br/> 手机号：    ${userResult.phone}` : ""}
        ${userResult.email ? `<br/> 邮箱：    ${userResult.email}` : ""}
        <br/> 退款订单号： ${id}
        <br/> 退款金额： ${orderResult.total_fee / 100}
        <br/> 支付平台交易号：${orderResult.trade_id}
        <br/>
        <br/> 同意后，请通知相关客服在运营后台输入验证码 ${code} 进行退款确认。
        `
      };
      const mailResult = await sendCustomMail(data);
      if (!mailResult || JSON.parse(mailResult).code != "200") {
        throw new Error("发送邮件失败!");
      }
    } else {
      throw new Error("umsRedis写入出错");
    }
    return `验证码已发送至管理员邮箱: ${REFUND_APPLY_MAILTO.split(
      ","
    )}, 请在7天内完成验证.`;
  };
  that.refundNewOrder = async (req) => {
    try {
      const { id, userid, code } = req.body;
      const redisCode = await umsRedis.get(`refundApply:${id}`);
      if (redisCode * 1 == code * 1) {
        const refundResult = await api.orderRefund({
          userid: userid,
          order_id: id
        });
        if (refundResult?.code == 200) {
          refundResult.data.orderByIds.forEach(async (item) => {
            await mySqlConn.runQuery({
              sql: `UPDATE tv_order_buy SET is_refund = 1 WHERE id = ${item}`
            });
          });
          refundResult.data.androidOrderIds.forEach(async (item) => {
            await mySqlConn.runQuery({
              sql: `UPDATE tv_controlled_order SET is_refund = 1 WHERE id = ${item}`
            });
          });
          return "退款成功";
        } else {
          throw new Error(`退款接口返回错误:${refundResult?.code || ""}`);
        }
      } else {
        throw new Error("验证码错误!");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  that.getNewProductSPU = async (req) => {
    let whereStr = `WHERE 1=1 AND status = 1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_product_spu
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_product_spu
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getNewProductsBySPUID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT p.id, p.name, (SELECT name FROM tv_product_spu WHERE id = p.f_spu_id) AS f_spu_name,
        p.try_day, p.platform, p.original_price, p.is_use_coupon, p.month_price, 
        p.year_price, p.cycle_month_price, p.min_amount, p.max_amount, p.status
        FROM tv_product p
        WHERE p.spu_id = '${req.params.id}'`
      })
    ).result;
  };

  that.getNewProductDetails = async (req) => {
    let whereStr = `WHERE 1=1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_product
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_product
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getNewProductDetailsByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_product WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.updateNewProductDetail = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_product SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_product, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_product SET ? `,
        values: config
      });
      return `insert tv_product, result: ${result}`;
    }
  };

  that.getNewProductGrays = async (req) => {
    let whereStr = `WHERE 1=1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM tv_product_gray
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_product_gray
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getNewProductGrayByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_product_gray WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.updateNewProductGray = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_product_gray SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_product_gray, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_product_gray SET ? `,
        values: config
      });
      return `insert tv_product_gray, result: ${result}`;
    }
  };
  that.syncNewProductGrayToFormal = async (req) => {
    let config = { ...req.body };
    let grayResult = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_product_gray WHERE id = '${config.id}'`
      })
    ).result[0];
    if (grayResult) {
      if (grayResult.status != 1) {
        throw new Error("灰度产品状态为不可同步");
      }
      grayResult.status = 0;
      const formalResult = (
        await mySqlConn.runQuery({
          sql: `SELECT * FROM tv_product WHERE id = '${grayResult.product_id}'`
        })
      ).result[0];
      if (formalResult) {
        // let result = await mySqlConn.runQuery({
        //   sql: `UPDATE tv_product SET ? WHERE id= ? `,
        //   values: [grayResult, grayResult.product_id]
        // });
        // return `update tv_product, result: ${result}`;
        throw new Error("已有同ID正式产品");
      } else {
        let result = await mySqlConn.runQuery({
          sql: `INSERT INTO tv_product SET ? `,
          values: grayResult
        });
        return `insert tv_product, result: ${result}`;
      }
    } else {
      throw new Error("灰度数据不存在");
    }
  }

  that.getBlackList = async (req) => {
    const { key } = req.params;
    if (redisMap[key]) {
      const result = await redisMap[key].smembers(key);
      return result;
    }
  };
  that.getBlackListSISMEMBER = async (req) => {
    const { key, value } = req.query;
    if (redisMap[key]) {
      const data = await redisMap[key].sismember(key, value);
      return data;
    } else {
      throw new Error("Key不在允许范围内!");
    }
  };
  that.addBlackList = async (req) => {
    const { key, newValue } = req.body;
    if (redisMap[key]) {
      const data = await redisMap[key].sismember(key, newValue);
      if (data) {
        throw new Error("Key已存在!");
      } else {
        const result = await redisMap[key].sadd(key, newValue);
        return result;
      }
    } else {
      throw new Error("Key不在允许范围内!");
    }
  };
  that.updateBlackList = async (req) => {
    const { key, value, newValue } = req.body;
    if (redisMap[key]) {
      let result;
      if (value) {
        await redisMap[key].srem(key, value);
        result = await redisMap[key].sadd(key, newValue);
      } else {
        result = await redisMap[key].sadd(key, newValue);
      }
      return result;
    } else {
      throw new Error("Key不在允许范围内!");
    }
  };
  that.deleteBlackList = async (req) => {
    const { key, value } = req.query;
    if (redisMap[key]) {
      const result = await redisMap[key].srem(key, value);
      return result;
    } else {
      throw new Error("Key不在允许范围内!");
    }
  };
  that.sendUserPhoneCode = async (req) => {
    if (!CHANGE_USERPHONE_MAILTO) {
      throw new Error("未配置接收验证码的管理员邮箱!");
    }
    const { oldPhone, userid, nickname } = req.body;
    const code = Math.random().toString().slice(-6);
    const redisResult = await umsRedis.set(
      `changePhone:${userid}`,
      code,
      "EX",
      1800
    );
    if (redisResult == "OK") {
      const data = {
        mailto: CHANGE_USERPHONE_MAILTO.split(","),
        title: "用户手机号变更申请",
        content: `验证码: ${code}, 请在30分钟内完成验证。
        <br/> 收到个人版注册用户手机号变更申请, 操作人： ${req.user.username}
        <br/> 用户ID: ${userid}, 用户昵称：${nickname}, 手机号:${oldPhone}`
      };
      const mailResult = await sendCustomMail(data);
      if (!mailResult || JSON.parse(mailResult).code != "200") {
        throw new Error("发送邮件失败!");
      }
    } else {
      throw new Error("umsRedis写入出错");
    }
    return `验证码已发送至管理员邮箱: ${CHANGE_USERPHONE_MAILTO}, 请在30分钟内完成验证.`;
  };

  const isValidPhoneAndEmail = async (newPhone, newEmail) => {
    if (!newPhone && !newEmail) {
      throw new Error("新手机号和新邮箱至少填写一项");
    }
    if (newPhone) {
      const { result } = await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_user WHERE phone = '${newPhone}' OR email = '${newPhone}'`
      });
      if (result.length > 0) {
        throw new Error("手机号已存在!");
      }
    }
    if (newEmail) {
      const { result } = await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_user WHERE email = '${newEmail}' OR phone = '${newEmail}'`
      });
      if (result.length > 0) {
        throw new Error("邮箱已存在!");
      }
    }
    return;
  };
  that.updateUserPhone = async (req) => {
    try {
      const { id, nickname, code, phone, email, newPhone, newEmail } = req.body;
      await isValidPhoneAndEmail(newPhone, newEmail);
      const redisCode = await umsRedis.get(`changePhone:${id}`);
      if (redisCode == code) {
        const values = {};
        if (newPhone) {
          values.phone = newPhone;
        }
        if (newEmail) {
          values.email = newEmail;
        }
        const { result } = await mySqlConn.runQuery({
          sql: `UPDATE tv_user SET ? WHERE id = ${id}`,
          values
        });
        if (result.affectedRows > 0) {
          return "变更成功!";
        } else {
          throw new Error("变更失败!");
        }
      } else {
        throw new Error("验证码错误!");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  that.getCycleAgreements = async (req) => {
    const { product } = JSON.parse(req.query.options);
    let whereStr = `WHERE 1=1 ${product
      ? `AND id IN (SELECT DISTINCT(cycle_agreement_id) FROM tv_cycle_agreement_detail WHERE product_id = ${product[1]})`
      : ""
      }`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, userid, channel, agreement_no, period_type, period, single_amount,
    status, execute_time, next_exceed_time, create_time, cancel_time
    FROM tv_cycle_agreement
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_cycle_agreement
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getCycleAgreementByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT a.*,
        u.phone AS user_phone, u.email AS user_email, u.nickname AS user_nickname,
        w.unionid AS wechat_unionid
        FROM tv_cycle_agreement a
        LEFT JOIN tv_user u ON a.userid = u.id
        LEFT JOIN tv_wechat_user w ON a.userid = w.userid
        WHERE a.id = '${req.params.id}'`
      })
    ).result;
  };
  that.getCycleAgreementDetailsByAgreementID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT d.*, p.name AS product_name, p.platform AS product_platform,
        (SELECT name FROM tv_product_spu WHERE id = p.f_spu_id) AS product_f_spu_name
        FROM tv_cycle_agreement_detail d
        LEFT JOIN tv_product p ON d.product_id = p.id
        WHERE d.cycle_agreement_id = '${req.params.id}'`
      })
    ).result;
  };
  that.getCycleAgreementDetailByDetailID = async (req) => {
    let orderDetailResult = (
      await mySqlConn.runQuery({
        sql: `SELECT d.*, p.name AS product_name, p.platform AS product_platform, p.spu_id AS product_spu_id,
        (SELECT name FROM tv_product_spu WHERE id = p.spu_id) AS product_spu_name,
        (SELECT name FROM tv_product_spu WHERE id = p.f_spu_id) AS product_f_spu_name
        FROM tv_cycle_agreement_detail d
        LEFT JOIN tv_product p ON d.product_id = p.id
        WHERE d.id = '${req.params.id}'`
      })
    ).result[0];
    let result = { orderDetailResult };
    return result;
  };

  that.getGPUWhiteList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM tv_gpu_white_list ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_gpu_white_list ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getGPUWhiteListByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_gpu_white_list WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.deleteGPUWhiteList = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM tv_gpu_white_list WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateGPUWhiteList = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_gpu_white_list SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_gpu_white_list, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_gpu_white_list SET ? `,
        values: config
      });
      return `insert tv_gpu_white_list, result: ${result}`;
    }
  };

  that.getGPUBlackList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM tv_gpu_black_list ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM tv_gpu_black_list ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getGPUBlackListByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_gpu_black_list WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.deleteGPUBlackList = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM tv_gpu_black_list WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateGPUBlackList = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_gpu_black_list SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_gpu_black_list, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_gpu_black_list SET ? `,
        values: config
      });
      return `insert tv_gpu_black_list, result: ${result}`;
    }
  };

  that.getNewCoupons = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let list = (
      await mySqlConn.runQuery({
        sql: `SELECT c.id, c.info, c.pcode, c.cycle_type, c.coupon_type, c.salelimit, c.sale,
      c.total_limit_times, c.user_limit_times, c.start_time, c.end_time, c.is_deleted, c.creator_id, c.last_operator_id
      FROM tv_coupon_new c 
      ${SQLpostfixGenerator(whereStr, req.query)} `
      })
    ).result;
    let { total } = (
      await mySqlConn.runQuery({
        sql: `SELECT COUNT(id) AS total FROM tv_coupon_new ${whereStr}`
      })
    ).result[0];
    let result = { list, total };
    return result;
  };
  that.getNewCouponByID = async (req) => {
    const couponResult = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_coupon_new WHERE id = '${req.params.id}'`
      })
    ).result[0];
    if (couponResult.product_ids) {
      let productsBySPU = (
        await mySqlConn.runQuery({
          sql: `SELECT spu_id, id FROM tv_product 
          WHERE status = 1 AND id IN (${couponResult.product_ids})`
        })
      ).result;
      couponResult.product_ids = productsBySPU.map((item) => [
        item.spu_id,
        item.id
      ]);
    }
    return couponResult;
  };
  that.deleteNewCoupon = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE tv_coupon_new 
      SET is_deleted = IF(is_deleted = 1, 0, 1)
      WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateNewCoupon = async (req) => {
    let config = { ...req.body };
    let { id } = config;
    delete config["id"];
    if (id) {
      config.last_operator_id = req.user.id;
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_coupon_new SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_coupon_new, result: ${result}`;
    } else {
      config.creator_id = req.user.id;
      config.last_operator_id = req.user.id;
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_coupon_new SET ? `,
        values: config
      });
      return `insert tv_coupon_new, result: ${result}`;
    }
  };


  that.getNewProductCombos = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let list = (
      await mySqlConn.runQuery({
        sql: `SELECT c.*, 
        (SELECT COUNT(o.id) FROM tv_bill_order o WHERE o.combine_product_id = c.id) AS sold_amount,
        (SELECT AVG(o.total_fee) FROM tv_bill_order o WHERE o.combine_product_id = c.id AND o.status = 2) AS avg_price
        FROM tv_combine_product c 
      ${SQLpostfixGenerator(whereStr, req.query)} `
      })
    ).result;
    let { total } = (
      await mySqlConn.runQuery({
        sql: `SELECT COUNT(id) AS total FROM tv_combine_product ${whereStr}`
      })
    ).result[0];
    let result = { list, total };
    return result;
  };
  that.getNewProductComboByID = async (req) => {
    const comboResult = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM tv_combine_product WHERE id = '${req.params.id}'`
      })
    ).result[0];
    if (comboResult.product_ids) {
      let productsBySPU = (
        await mySqlConn.runQuery({
          sql: `SELECT spu_id, id FROM tv_product 
          WHERE status = 1 AND id IN (${comboResult.product_ids})`
        })
      ).result;
      comboResult.product_ids = productsBySPU.map((item) => [
        item.spu_id,
        item.id
      ]);
    }
    return comboResult;
  };
  that.deleteNewProductCombo = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE tv_combine_product 
      SET is_deleted = IF(is_deleted = 1, 0, 1)
      WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.updateNewProductCombo = async (req) => {
    let config = { ...req.body };
    let { id } = config;
    delete config["id"];
    if (id) {
      config.last_operator_id = req.user.id;
      let result = await mySqlConn.runQuery({
        sql: `UPDATE tv_combine_product SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update tv_combine_product, result: ${result}`;
    } else {
      config.creator_id = req.user.id;
      config.last_operator_id = req.user.id;
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO tv_combine_product SET ? `,
        values: config
      });
      return `insert tv_combine_product, result: ${result}`;
    }
  };

  return that;
}

module.exports = new userModel();
