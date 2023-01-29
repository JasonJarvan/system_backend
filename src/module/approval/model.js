const mysql = require("../common/mysql");
const mySqlConn = mysql({ multipleStatements: true, dbname: "admin" });
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const handler = require("./handler");

function approval() {
  const that = this;
  that.getFlowListNums = async (req) => {
    const { id: admin_id } = req.user;
    const result = (
      await mySqlConn.runQuery({
        sql: `SELECT
        COUNT(CASE WHEN(f.config_id = '1' AND f.level <= r.level AND f.status = 0) THEN 1 ELSE null END) AS refundApproveWaitTotal,
        COUNT(CASE WHEN(f.config_id = '2' AND f.level <= r.level AND f.status = 0) THEN 1 ELSE null END) AS upgradeApproveWaitTotal,
        COUNT(CASE WHEN(f.config_id = '1' AND f.admin_id = ${admin_id} AND f.status = 0) THEN 1 ELSE null END) AS refundApplyWaitTotal,
        COUNT(CASE WHEN(f.config_id = '1' AND f.admin_id = ${admin_id} AND f.status = 1) THEN 1 ELSE null END) AS refundApplyPassTotal,
        COUNT(CASE WHEN(f.config_id = '1' AND f.admin_id = ${admin_id} AND f.status = 2) THEN 1 ELSE null END) AS refundApplyFailTotal,
        COUNT(CASE WHEN(f.config_id = '2' AND f.admin_id = ${admin_id} AND f.status = 0) THEN 1 ELSE null END) AS upgradeApplyWaitTotal,
        COUNT(CASE WHEN(f.config_id = '2' AND f.admin_id = ${admin_id} AND f.status = 1) THEN 1 ELSE null END) AS upgradeApplyPassTotal,
        COUNT(CASE WHEN(f.config_id = '2' AND f.admin_id = ${admin_id} AND f.status = 2) THEN 1 ELSE null END) AS upgradeApplyFailTotal
        FROM ums_approval_flow f 
        LEFT JOIN ums_approval_relation r 
        ON r.type = 0 AND f.config_id = r.config_id 
        AND r.level=f.level+1 AND r.relate_id = ${admin_id}
        `
      })
    ).result;
    return result;
  };
  that.getFlowList = async (req) => {
    const { id: admin_id } = req.user;
    const options = JSON.parse(req.query.options);
    let whereStr = "WHERE 1=1 ";
    whereStr = whereStrGenerator(whereStr, req.query, {
      status: "f.status",
      level: "f.level",
      type: "f.config_id",
      create_time: "f.create_time"
    });
    if (options?.related == 1) {
      whereStr += ` AND f.level <= r.level `;
    } else if (options?.related == 2) {
      whereStr += ` AND f.admin_id=${admin_id} `;
    }
    const sql = `SELECT 
            f.id,
            f.config_id AS type,
            f.level,
            f.params,
            f.userid,
            f.remark,
            f.status,
            f.create_time,
            fc.name as flowname,
            a.username,
            IF(f.level < r.level AND f.status=0,1,0) AS approvable
        FROM
            ums_approval_flow f
                LEFT JOIN
            ums_approval_flow_config fc ON fc.id = f.config_id
                LEFT JOIN
            ums_approval_relation r ON r.type = 0 AND f.config_id = r.config_id AND r.level=f.level+1 AND r.relate_id = ${admin_id}
                LEFT JOIN
            ums_admin a ON a.id = f.admin_id
        ${SQLpostfixGenerator(whereStr, req.query)}`;
    const getCountSql = `SELECT COUNT(1) AS total FROM ums_approval_flow f 
    LEFT JOIN ums_approval_relation r 
    ON r.type = 0 AND f.config_id = r.config_id 
    AND r.level=f.level+1 AND r.relate_id = ${admin_id}
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getFlowDetail = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT fd.id,fd.level,fd.status,fd.remark,fc.name as flowname,a.username,fd.create_time
        FROM ums_approval_flow_detail fd  
        LEFT JOIN ums_approval_flow f ON f.id=fd.flow_id
        LEFT JOIN ums_approval_flow_config fc ON fc.id = f.config_id
        LEFT JOIN ums_admin a ON a.id = fd.admin_id
        WHERE f.id='${req.params.id}'`
      })
    ).result;
  };
  that.getRefundList = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_approval_refund WHERE flow_id='${req.params.id}'`
      })
    ).result;
  };
  that.getUpgradeList = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_approval_upgrade WHERE flow_id='${req.params.id}'`
      })
    ).result;
  };
  /**
   *
   * @param {number} type 1退款申请 2权益升级 3权益变更
   * @param {number} admin_id 审批发起人id
   * @param {*} params 参数JSON
   * @param {number} userid 申请人id 订单关联用户id
   * @param {string} remark 备注
   * @returns
   */
  that.addFlow = async (type, admin_id, params, remark, extra) => {
    const { result } = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_approval_flow SET ?;`,
      values: [
        {
          config_id: type,
          admin_id,
          params:
            typeof params == "object" ? JSON.stringify(params) : params + "",
          remark,
          extra: typeof extra == "object" ? JSON.stringify(extra) : extra + ""
        }
      ]
    });
    return result;
  };
  that.addRefund = async ({ admin_id, list, remark }) => {
    if (!list || list.length == 0) throw new Error("没有退款信息");
    const { result: check } = await mySqlConn.runQuery({
      sql: `SELECT r.order_id FROM ums_approval_refund r 
      LEFT JOIN ums_approval_flow f ON f.id=r.flow_id WHERE r.order_id IN (?) AND f.status=0`,
      values: [list.map((l) => l.order_id)]
    });
    if (check.length > 0)
      throw new Error(
        "订单id " + check.map((c) => c.order_id).join(",") + " 已申请退款"
      );
    const { result: insertResult } = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_approval_flow SET ?;`,
      values: [
        {
          config_id: 1,
          admin_id,
          remark
        }
      ]
    });
    await mySqlConn.runQuery({
      sql: list.map(() => `INSERT INTO ums_approval_refund SET ?`).join(";"),
      values: list.map((l) => ({
        flow_id: insertResult.insertId,
        userid: l.userid,
        order_id: l.order_id || l.id,
        user_nickname: l.user_nickname,
        user_phone: l.user_phone,
        user_email: l.user_email,
        total_fee: l.total_fee,
        pay_time: l.pay_time
      }))
    });
  };
  that.addUpgrade = async ({ admin_id, list, remark }) => {
    if (!list || list.length == 0) throw new Error("没有权益升级信息");
    /*   const { result: check } = await mySqlConn.runQuery({
      sql: `SELECT r.userid FROM ums_approval_upgrade r 
      LEFT JOIN ums_approval_flow f ON f.id=r.flow_id WHERE r.userid IN (?) AND f.status=0`,
      values: [list.map((l) => l.userid)]
    });
    if (check.length > 0)
      throw new Error(
        "用户id " + check.map((c) => c.userid).join(",") + " 已申请权益升级"
      ); */
    const { result: insertResult } = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_approval_flow SET ?;`,
      values: [
        {
          config_id: 2,
          admin_id,
          remark
        }
      ]
    });
    await mySqlConn.runQuery({
      sql: list.map(() => `INSERT INTO ums_approval_upgrade SET ?`).join(";"),
      values: list.map((l) => ({
        flow_id: insertResult.insertId,
        userid: l.userid,
        spu_id: l.spu_id || l.spuId,
        order_type: l.order_type || l.orderType,
        trade_id: l.trade_id,
        macid: l.macid,
        day: l.day,
        amount: l.amount,
        actual_price: Math.floor((l.actual_price || l.actualPrice || 0) * 100)
      }))
    });
  };
  that.approveFlow = async (req) => {
    const { flow_id, status, remark } = req.body;
    const { id: admin_id } = req.user;
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT f.*,fc.level as config_level,fc.handler FROM ums_approval_flow f 
      LEFT JOIN ums_approval_flow_config fc ON fc.id = f.config_id WHERE f.id=?`,
      values: [flow_id]
    });
    const [flow] = result;
    let { level, status: currStatus, config_id } = flow;
    level++;
    const { result: relation } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_approval_relation r 
      WHERE r.type = 0 AND (r.config_id=? OR r.config_id IS NULL) AND r.relate_id = ? AND (r.level=? OR r.level=0)`,
      values: [config_id, admin_id, level]
    });
    if (relation.length == 0) throw new Error("没有权限审批");
    if (currStatus == 1 || currStatus == 2) throw new Error("审批流程已完成");
    const flowValue = { level };
    if (status == 1) {
      //通过
      if (level == flow.config_level) {
        // 审批完成
        flowValue.status = 1;
        switch (config_id) {
          case 1: {
            const { result: refundList } = await mySqlConn.runQuery({
              sql: `SELECT id,userid,order_id FROM ums_approval_refund r WHERE r.flow_id=? AND status=0`,
              values: [flow_id]
            });
            // 调用接口
            await Promise.all(
              refundList.map(async (params) => {
                await handler.refund(params);
                // 更新状态
                await mySqlConn.runQuery({
                  sql: `UPDATE ums_approval_refund SET status=1 WHERE id = ?`,
                  values: [params.id]
                });
              })
            );
            break;
          }
          case 2: {
            const { result: upgradeList } = await mySqlConn.runQuery({
              sql: `SELECT * FROM ums_approval_upgrade r WHERE r.flow_id=? AND status=0`,
              values: [flow_id]
            });
            // 调用接口
            await Promise.all(
              upgradeList.map(async (params) => {
                await handler.upgrade({
                  spuId: params.spu_id,
                  desc: flow.remark,
                  actualPrice: params.actual_price / 100,
                  orderType: params.order_type,
                  ...params
                });
                // 更新状态
                await mySqlConn.runQuery({
                  sql: `UPDATE ums_approval_upgrade SET status=1 WHERE id = ?`,
                  values: [params.id]
                });
              })
            );
            break;
          }
          default:
            break;
        }
      }
    } else {
      flowValue.status = 2;
    }

    await mySqlConn.runQuery({
      sql: `UPDATE ums_approval_flow SET ? WHERE id=?`,
      values: [flowValue, flow_id]
    });
    await mySqlConn.runQuery({
      sql: `INSERT INTO ums_approval_flow_detail SET ?;`,
      values: [{ flow_id, admin_id, level, status, remark }]
    });

    return status;
  };

  return that;
}

module.exports = new approval();
