const ums_mysql = require("../common/mysql");
const mySqlConn = ums_mysql({ multipleStatements: true, dbname: "admin" });
const tv_mySqlConn = ums_mysql({ dbname: "center" });
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator,
  converDataListToObject,
  whenThenGenerator,
  inGenerator
} = require("../common/modelHelper.js");
const e = require("express");
const currentSecond = (module.exports = function user() {
  let that = this;
  that.getPackage = async (userid) => {
    try {
      return (
        await tv_mySqlConn.runQuery({
          sql: `SELECT u.nickname, u.phone, u.email, u.viplevel, p.*
          FROM tv_package as p 
          JOIN tv_user as u on p.userid=u.id
          WHERE p.userid = ${userid}`
        })
      ).result[0];
    } catch (error) {
      console.error(error);
    }
    /* return an Object {
        nickname: 'Todesk',
        phone: '17511601051',
        email: null,
        id: 111,
        pname: '2222',
        userid: 2960373,
        rps: 1,
        tps: 2,
        gnum: 3,
        activenum: 0,
        endtime: 1666148919,
        orderid: 1,
        a_id: 1,
        viplevel: 2
      }*/
  };

  that.getApplyByID = async (applyid) => {
    try {
      return (
        await tv_mySqlConn.runQuery({
          sql: `SELECT * FROM tv_application
          WHERE applyid = ${applyid}`
        })
      ).result[0];
    } catch (error) {
      console.error(error);
    }
  };

  that.getApplyByUserID = async (apply_userid) => {
    try {
      return (
        await tv_mySqlConn.runQuery({
          sql: `SELECT * FROM tv_application
          WHERE apply_userid = ${apply_userid}`
        })
      ).result;
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * @param {?int} req.user.id 发起请求者的ID.插入时有效。作为applierid。由useRequest自动发送。
   * @param {?int} req.body.applyid 审核的ID。非空则更新审核，空则插入审核。
   * @param {?int} req.body.apply_state 审核状态,更新时有效。1:待审批,2:已审批,3:已驳回
   * @param {?int} req.body.apply_type 审批类型,插入时有效。1退款，2更改套餐.
   * @param {?int} req.body.apply_userid 审批相关用户的ID。插入时有效。
   * @param {?Object} req.body.modifyOpt 若退款审批则空，插入更改套餐才有。
   * @param {?int} req.body.modifyOpt.meal_type 更改后的套餐类型,1专业版,2企业版
   * @param {?int} req.body.modifyOpt.active_num 更改后的通道数
   * @param {?int} req.body.modifyOpt.endtime 更改后的结束时间
   * @returns
   */
  that.updateApply = async (req) => {
    // console.log(req.user, req.body);
    try {
      if (req.body.applyid) {
        // 更新审批状态
        const apply = await this.getApplyByID(req.body.applyid);
        // console.log('apply = ', apply);
        if (req.body.apply_state == 2) {
          // 审批通过
          if (apply.apply_type == 1) {
            // 退款审核，找到用户上一次的订单，它是即将生效的订单
            let preOrder = (
              await tv_mySqlConn.runQuery({
                sql: `SELECT * FROM tv_order_buy WHERE id = ${apply.apply_orderid}`
              })
            ).result[0];
            // console.log('preOrder = ', preOrder);
            if (apply.apply_orderid == apply.apply_orderid_before) {
              // 如果用户apply_orderid == apply_orderid_before,备份套餐并删除.
              let backupPackageResult = (
                await tv_mySqlConn.runQuery({
                  sql: `INSERT IGNORE INTO tv_package_bak SELECT * FROM tv_package WHERE userid = ${apply.apply_userid}`
                })
              ).result;
              let deletePackageResult = (
                await tv_mySqlConn.runQuery({
                  sql: `DELETE FROM tv_package WHERE userid = ${apply.apply_userid} `
                })
              ).result;
              let updateUserResult = (
                await tv_mySqlConn.runQuery({
                  sql: `UPDATE tv_user SET ? WHERE id = ${apply.apply_userid} `,
                  values: {
                    viplevel: 0
                  }
                })
              ).result;
              // console.log('deletePackageResult = ', deletePackageResult, ' updateUserResult = ', updateUserResult);
            } else {
              // 如果用户有上一次的订单，用上一次的订单情况更新当前的套餐
              let updatePackageResult = (
                await tv_mySqlConn.runQuery({
                  sql: `UPDATE tv_package SET ? WHERE userid = ${apply.apply_userid} `,
                  values: {
                    orderid: preOrder.id,
                    tps: preOrder.passive_num,
                    gnum: preOrder.g_num,
                    rps: preOrder.active_num,
                    endtime: preOrder.endtime
                  }
                })
              ).result;
              let updateUserResult = (
                await tv_mySqlConn.runQuery({
                  sql: `UPDATE tv_user SET ? WHERE id = ${apply.apply_userid} `,
                  values: {
                    viplevel: preOrder.viplevel
                  }
                })
              ).result;
              // console.log('updatePackageResult = ', updatePackageResult, ' updateUserResult = ', updateUserResult);
            }
          }
          if (apply.apply_type == 2) {
            // 更改订单审核，需要更新关联订单
            let currentOrder = (
              await tv_mySqlConn.runQuery({
                sql: `SELECT * FROM tv_order_buy WHERE id = ${apply.apply_orderid}`
              })
            ).result[0];
            let preOrder = (
              await tv_mySqlConn.runQuery({
                sql: `SELECT * FROM tv_order_buy WHERE id = ${apply.apply_orderid_before}`
              })
            ).result[0];
            if (!preOrder || !currentOrder) {
              throw new Error("套餐关联的订单不存在！");
            }
            // console.log('currentOrder = ', currentOrder, 'preOrder = ', preOrder);
            // 更新即将生效的订单
            let updateCurrentOrderResult = (
              await tv_mySqlConn.runQuery({
                sql: `UPDATE tv_order_buy SET ? WHERE id = ${apply.apply_orderid} `,
                values: {
                  pay_time: parseInt(new Date().getTime() / 1000),
                  state: 1
                }
              })
            ).result;
            // 若当前属于升级订单，则更新即将失效的订单的is_refund：2
            if (currentOrder.viplevel > preOrder.viplevel) {
              let updatePreviousOrderResult = (
                await tv_mySqlConn.runQuery({
                  sql: `UPDATE tv_order_buy SET ? WHERE id = ${apply.apply_orderid_before} `,
                  values: {
                    is_refund: 2
                  }
                })
              ).result;
            }
            // 更新套餐
            let updatePackageResult = (
              await tv_mySqlConn.runQuery({
                sql: `UPDATE tv_package SET ? WHERE userid = ${apply.apply_userid} `,
                values: {
                  orderid: currentOrder.id,
                  tps: currentOrder.passive_num,
                  gnum: currentOrder.g_num,
                  rps: currentOrder.active_num,
                  endtime: currentOrder.endtime
                }
              })
            ).result;
            // console.log('updatePackageResult = ', updatePackageResult);
            // 更新用户信息
            let updateUserResult = (
              await tv_mySqlConn.runQuery({
                sql: `UPDATE tv_user SET ? WHERE id = ${apply.apply_userid} `,
                values: {
                  viplevel: currentOrder.viplevel
                }
              })
            ).result;
          }
        }
        let updateApplyResult = await tv_mySqlConn.runQuery({
          sql: `UPDATE tv_application SET ? WHERE applyid= ${req.body.applyid} `,
          values: {
            apply_state: req.body.apply_state
          }
        });
        // console.log(updateApplyResult);
        return `update config, updateApplyResult: ${updateApplyResult}`;
      } else {
        // 插入新的审批
        const applies = await this.getApplyByUserID(req.body.apply_userid);
        // 若存在待审批的申请，则返回错误
        applies.forEach((apply) => {
          if (apply?.apply_state == 1) {
            throw new Error("存在待审批的申请！");
          }
        });
        // 插入前，将该用户名下所有已存在申请设为失效。
        let updateEffectiveResult = (
          await tv_mySqlConn.runQuery({
            sql: `UPDATE tv_application SET ? WHERE apply_userid = ${req.body.apply_userid}`,
            values: { apply_effective: 0 }
          })
        ).result;
        // 查询用户套餐状态。
        const userPackage = await this.getPackage(req.body.apply_userid);
        // console.log('userPackage = ', userPackage);
        let applyOrderidAfter;
        let applyOrderidRefund;
        if (req.body.apply_type == 1) {
          // 插入退款申请时，要查询用户上一次的有效订单。
          // 有效订单定义：不是免费的，已支付的，未被退款的，过期时间大于当前时间的。
          let currentOrder = (
            await tv_mySqlConn.runQuery({
              sql: `SELECT * FROM tv_order_buy WHERE id = ${userPackage.orderid}`
            })
          ).result[0];
          if (!currentOrder) {
            throw new Error("套餐关联的订单不存在！");
          }
          // 如果当前是一笔有效订单，那就追溯到上一笔有效订单。应退订单默认值，当前订单。
          // 如果上一笔有效订单不存在，那么applyUseridAfter自然为空，orderid会取默认值，等于当前套餐的orderid。
          applyOrderidAfter = (
            await tv_mySqlConn.runQuery({
              sql: `SELECT id from tv_order_buy 
                WHERE userid = ${req.body.apply_userid} AND id < ${
                userPackage.orderid
              }
                AND is_refund !=1 AND total_fee != 0 AND state=1 AND endtime > ${parseInt(
                  new Date().getTime() / 1000
                )}
                ORDER BY id DESC LIMIT 0,1`
            })
          ).result[0]?.id;
          // 如果当前是一笔无效订单，那就追溯到上一笔有效订单的上一笔有效订单。同时，应退订单为上一笔有效订单。
          if (
            applyOrderidAfter ||
            currentOrder.is_refund == 1 ||
            currentOrder.total_price == 0 ||
            currentOrder.endtime <= parseInt(new Date().getTime() / 1000)
          ) {
            applyOrderidRefund = applyOrderidAfter;
            applyOrderidAfter = (
              await tv_mySqlConn.runQuery({
                sql: `SELECT id FROM tv_order_buy 
                  WHERE userid = ${
                    req.body.apply_userid
                  } AND id < ${applyOrderidAfter}
                  AND is_refund !=1 AND total_fee != 0 AND state=1 AND endtime > ${parseInt(
                    new Date().getTime() / 1000
                  )}
                  ORDER BY id DESC LIMIT 0,1`
              })
            ).result[0]?.id;
          }
        } else if (req.body.apply_type == 2) {
          // 插入更改套餐申请的同时，要新增更改套餐相关的订单
          const targetViplevel = req.body.modifyOpt.meal_type == 1 ? 2 : 3;
          const insertOrderData = {
            userid: req.body.apply_userid,
            phone: userPackage.phone,
            pay_type: 3,
            meal_type: req.body.modifyOpt.meal_type,
            viplevel: targetViplevel,
            endtime: req.body.modifyOpt.endtime,
            active_num:
              req.body.modifyOpt.meal_type == 1
                ? 1
                : req.body.modifyOpt.active_num,
            g_num:
              req.body.modifyOpt.meal_type == 1
                ? 100
                : req.body.modifyOpt.active_num <= 3
                ? 300
                : req.body.modifyOpt.active_num * 100,
            passive_num:
              req.body.modifyOpt.meal_type == 1
                ? 200
                : req.body.modifyOpt.active_num <= 3
                ? 300
                : req.body.modifyOpt.active_num * 100,
            year: parseInt(
              (req.body.modifyOpt.endtime - userPackage.endtime) / 31276800
            ),
            trade_name: "手工修改",
            create_time: parseInt(new Date().getTime() / 1000),
            state: 0,
            is_renew: targetViplevel > userPackage.viplevel ? 2 : 1
          };
          let insertOrderResult = (
            await tv_mySqlConn.runQuery({
              sql: `INSERT INTO tv_order_buy SET ? `,
              values: insertOrderData
            })
          ).result;
          applyOrderidAfter = insertOrderResult.insertId;
        }
        const insertApplySet = {
          applierid: req.user.id,
          apply_effective: 1,
          apply_type: req.body.apply_type,
          apply_state: 1,
          apply_userid: req.body.apply_userid,
          apply_orderid: applyOrderidAfter
            ? applyOrderidAfter
            : userPackage.orderid,
          apply_orderid_before: userPackage.orderid,
          apply_orderid_refund:
            req.body.apply_type == 1
              ? applyOrderidRefund
                ? applyOrderidRefund
                : userPackage.orderid
              : null
        };
        let insertApplyResult = (
          await tv_mySqlConn.runQuery({
            sql: `INSERT INTO tv_application SET ? `,
            values: insertApplySet
          })
        ).result;
        return `inserted, insertApplyResult = ${insertApplyResult}.`;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  that.getApply = async (applyid) => {
    try {
      const apply = await this.getApplyByID(applyid);
      // 返回1或2长数组
      const list = (
        await tv_mySqlConn.runQuery({
          sql: `SELECT id, userid, meal_type, active_num, endtime, viplevel 
            FROM tv_order_buy
            WHERE id IN (${apply?.apply_orderid ? apply.apply_orderid : ""}${
            apply?.apply_orderid_before ? "," + apply.apply_orderid_before : ""
          })
            ORDER BY id ASC`
        })
      ).result;
      // let refundInfo= {};
      // if (apply.apply_type == 1) {
      //   // 对退款请求，要算出退款总额
      //   // 退款总额算法有两种：所有实付金额之和 或 应退订单之金额。
      //   const orderIDRangeStr = apply?.apply_orderid == apply?.apply_orderid_before
      //     ? `id = ${apply?.apply_orderid} `
      //     : `id <= ${apply?.apply_orderid_before} AND id > ${apply?.apply_orderid_before} `
      //   refundInfo.sum = (await tv_mySqlConn.runQuery({
      //     sql: `SELECT SUM(actual_price) as refund FROM tv_order_buy
      //     WHERE userid = ${apply.apply_userid} AND ${orderIDRangeStr}
      //     AND is_refund !=1 AND total_price != 0 AND endtime > ${parseInt(new Date().getTime() / 1000)}`
      //   })).result[0];
      //   refundInfo.single = (await tv_mySqlConn.runQuery({
      //     sql: `SELECT actual_price FROM tv_order_buy
      //     WHERE id = ${apply.apply_orderid_refund}`
      //   })).result[0];
      //   refundInfo.orderid = apply.apply_orderid_refund;
      // }
      // const result = { list, refundInfo };
      return list;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  that.getApplyList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT a.*, u.phone
      FROM tv_application AS a
      LEFT JOIN tv_user AS u ON a.apply_userid=u.id
      ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(applyid) AS total
      FROM tv_application AS a
      LEFT JOIN tv_user AS u ON a.apply_userid=u.id
      ${whereStr}`;
    return getListBySQL(sql, getCountSql, tv_mySqlConn);
  };

  that.getVideoList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM ums_docs_video ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_docs_video ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getVideoByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_docs_video WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.updateVideo = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_docs_video SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_docs_video, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_docs_video SET ? `,
        values: config
      });
      return `insert ums_docs_video, result: ${result}`;
    }
  };
  that.deleteVideo = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_docs_video WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };

  that.getWWWConfigList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM ums_www_config ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_www_config ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getWWWConfigByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_www_config WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.updateWWWConfig = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_www_config SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_www_config, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_www_config SET ? `,
        values: config
      });
      return `insert ums_www_config, result: ${result}`;
    }
  };
  // that.deleteWWWConfig = async (id) => {
  //   const { result } = await mySqlConn.runQuery({
  //     sql: `DELETE FROM ums_www_config WHERE id= '${id}' `,
  //     values: [id]
  //   });
  //   return result;
  // };

  return that;
});
