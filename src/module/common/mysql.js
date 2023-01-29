const host = process.env.MYSQL_ToC_HOST || "localhost";
const port = process.env.MYSQL_ToC_PORT || 3307;
const user = process.env.MYSQL_ToC_USER || "root";
const password = process.env.MYSQL_ToC_PASS || "root";
const database = process.env.MYSQL_DBNAME || "todesk_admin";
const mysql = require("mysql");
const dbMap = {
  center: {
    host: process.env.MYSQL_ToC_HOST,
    port: process.env.MYSQL_ToC_PORT,
    user: process.env.MYSQL_ToC_USER,
    password: process.env.MYSQL_ToC_PASS,
    database: process.env.MYSQL_TODESK_DB
  },
  admin: {
    host: process.env.MYSQL_ToC_HOST,
    port: process.env.MYSQL_ToC_PORT,
    user: process.env.MYSQL_ToC_USER,
    password: process.env.MYSQL_ToC_PASS,
    database: process.env.MYSQL_DBNAME
  },
  bussiness: {
    host: process.env.MYSQL_ToB_HOST,
    port: process.env.MYSQL_ToB_PORT,
    user: process.env.MYSQL_ToB_USER,
    password: process.env.MYSQL_ToB_PASS,
    database: process.env.MYSQL_BUSSINESS_DB,
  },
  monitor: {
    host: process.env.MYSQL_ToB_HOST,
    port: process.env.MYSQL_ToB_PORT,
    user: process.env.MYSQL_ToB_USER,
    password: process.env.MYSQL_ToB_PASS,
    database: process.env.MYSQL_MONITOR_DB,
  },
  daas: {
    host: process.env.MYSQL_ToB_HOST,
    port: process.env.MYSQL_ToB_PORT,
    user: process.env.MYSQL_ToB_USER,
    password: process.env.MYSQL_ToB_PASS,
    database: process.env.MYSQL_DAAS_DB,
  }
};

module.exports = function connectionPool(opt) {
  let connectionPool = mysql.createPool({
    host: opt && opt.dbname ? dbMap[opt.dbname].host : host,
    port: opt && opt.dbname ? dbMap[opt.dbname].port : port,
    user: opt && opt.dbname ? dbMap[opt.dbname].user : user,
    password: opt && opt.dbname ? dbMap[opt.dbname].password : password,
    database: opt && opt.dbname ? dbMap[opt.dbname].database : database,
    connectionLimit: 10,
    ...opt
  });

  let getPoolConn = (res, rej, options) => {
    try {
      connectionPool.getConnection((err, connection) => {
        if (err) {
          rej(err);
          return;
        }
        connection.query({ ...options }, (err, result, fields) => {
          if (err) {
            rej(err);
          }
          connection.release();
          res({
            result,
            fields
          });
          return;
        });
      });
    } catch (error) {
      rej(error);
    }
  };
  /**
   *
   * options:mysql query options including {sql,values ....}
   *
   * @returns {result,fields}
   *
   */
  let runQuery = (options) => {
    return new Promise((res, rej) => {
      getPoolConn(res, rej, options);
    });
  };

  return {
    runQuery,
    connectionPool
  };
};
