const mysql = require("../common/mysql");
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

module.exports = function model() {
  const mySqlConn = mysql({ dbname: "admin" });
  const that = this;
  const packageDefinition = protoLoader.loadSync(
    path.join(__dirname + `../../../protobuf/message_center.proto`),
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: false,
      oneofs: true
    }
  );
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const proto = protoDescriptor.services;
  const updateConsumer = async (info) => {
    return new Promise((resolve, reject) => {
      const callback = (err, response) => {
        if (err) {
          console.error(err);
          reject(new Error("推送队列失败！"));
        }
        resolve(response);
      };
      const client = new proto.Consumer(
        info.server,
        grpc.credentials.createInsecure()
      );
      const id = info.id;
      if (id) {
        client.updateConsumer({ id }, callback);
      } else {
        client.updateAllConsumer(null, callback);
      }
    });
  };

  that.getConsumerList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM ums_message_center_consumer 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM ums_message_center_consumer ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.getCrontabList = async (req) => {
    let whereStr = "WHERE is_delete=0";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM ums_crontab 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM ums_crontab ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  that.addCrontab = async (req) => {
    const data = req.body;
    delete data["id"];
    const { result } = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_crontab SET create_time=now(), is_delete=0, ?`,
      values: [data]
    });
    const id = result.insertId;
    return {
      msg: " insert crontab",
      id: id,
    };
  };

  that.updateCrontab = async (req) => {
    const data = req.body;
    delete data["is_delete"];
    if (req.body.id) {
      await mySqlConn.runQuery({
        sql: `UPDATE ums_crontab SET ? WHERE id=? `,
        values: [data, req.body.id]
      });
      return " update crontab";
    }
  };

  that.deleteCrontab = async (id) => {
    if (id) {
      await mySqlConn.runQuery({
        sql: `UPDATE ums_crontab SET is_delete=1 WHERE id=? `,
        values: [id]
      });
      return ` deleted`;
    }
  };

  that.getConsumerById = async (id) => {
    const result = (
      await mySqlConn.runQuery({
        sql: "SELECT * FROM ums_message_center_consumer WHERE id = ?",
        values: [id]
      })
    ).result[0];
    return result;
  };
  that.updateConsumer = async (req) => {
    const data = {};
    const keys = [
      "name",
      "exchange",
      "queue",
      "routing_key",
      "instances",
      "prefetch",
      "retry_time",
      "server",
      "disabled"
    ];
    for (const key in req.body) {
      if (keys.includes(key)) {
        data[key] = req.body[key];
      }
    }
    await mySqlConn.runQuery({
      sql: `UPDATE ums_message_center_consumer SET ? WHERE id = ?`,
      values: [data, req.body.id]
    });
    try {
      await updateConsumer(req.body);
    } catch (error) {
      await mySqlConn.runQuery({
        sql: `UPDATE ums_message_center_consumer SET status=0 WHERE id = ?`,
        values: [req.body.id]
      });
      throw error;
    }
    return `updated`;
  };
  that.addConsumer = async (req) => {
    const data = req.body;
    const { result } = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_message_center_consumer SET ?`,
      values: [data]
    });
    try {
      await updateConsumer(data);
      return `added`;
    } catch (error) {
      await that.deleteConsumer(result.insertId);
      throw error;
    }
  };
  that.deleteConsumer = async (id) => {
    const orginal = await that.getConsumerById(id);
    await mySqlConn.runQuery({
      sql: `DELETE FROM ums_message_center_consumer WHERE id = ?`,
      values: [id]
    });
    try {
      await updateConsumer(orginal);
    } catch (error) {
      // console.log(error);
    }
    return `deleted`;
  };

  that.getErrorQueueList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM ums_message_center_error 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM ums_message_center_error ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  return that;
};
