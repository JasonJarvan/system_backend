const mysql = require("../common/mysql");
const api = require("../userCenter/api")();
const mySqlConn = mysql({ dbname: "center" });
module.exports = {
  // 退款申请
  async refund(params) {
    console.log("refund", params);
    const { order_id, userid } = params;
    const refundResult = await api.orderRefund({
      userid,
      order_id
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
  },
  // 权益升级
  async upgrade(params) {
    console.log("upgrade", params);
    const {
      userid,
      spuId,
      amount,
      desc = "手动添加",
      day,
      actualPrice = 0,
      orderType,
      trade_id,
      macid
    } = params;
    const upgradeResult = await api.generateOrder({
      userid,
      spuId,
      amount,
      desc,
      day,
      actualPrice,
      orderType,
      trade_id: trade_id + "",
      macid
    });
    if (upgradeResult?.code == 200) {
      return "升级成功";
    } else {
      throw new Error(`升级接口返回错误:${upgradeResult?.code || ""}`);
    }
  },
  // 权益变更
  async change(params) {
    console.log("change", params);
  }
};
