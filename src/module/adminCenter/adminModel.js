const mysql = require("../common/mysql");
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const moment = require("moment");
module.exports = function admin() {
  let mySqlConn = mysql({ dbname: "admin" });

  const insertUser = async (user) => {
    let sql = `INSERT INTO ums_admin SET create_time = now(), ?`;
    return await mySqlConn.runQuery({
      sql,
      values: user
    });
  };
  /**
   * @param {string}username
   */
  const findByUserName = async (username) => {
    let { result } = await mySqlConn.runQuery({
      sql: `select u1.id,u1.username,u1.password,u1.icon,u1.email,u1.nick_name,u1.create_time,u1.login_time,u1.status,GROUP_CONCAT(u3.name SEPARATOR ',') role_name
      from ums_admin u1 
      left join ums_admin_role_relation u2 on u1.id = u2.admin_id
      left join ums_role u3 on u2.role_id = u3.id
      WHERE u1.username = ? GROUP BY u1.id`,
      values: [username]
    });
    let user = result[0]
    let role = []
    if (user) {
      let { result: roleResult } = await mySqlConn.runQuery({
        sql: `SELECT role_id FROM ums_admin_role_relation WHERE admin_id=?`,
        values: [user.id]
      });
      roleResult.forEach(element => {
        role.push(element.role_id)
      });
      user.role = role
    }
    return user
  };
  /**
   * @param {string}username
   * @param {object} updateObj: key value pair
   */
  const updateUserByUsername = async (username, updateObj) => {
    let sql = ` UPDATE ums_admin SET ? WHERE username = ${username}`;
    return await mySqlConn.runQuery({
      sql,
      values: updateObj
    });
  };
  /**
   * @param {number}id
   * @param {number}status
   */
  const updateUserStatusById = async (id, status) => {
    console.log("id:" + id);
    console.log("status:" + status);
    let sql = ` UPDATE ums_admin SET status = ? WHERE id = ?`;
    console.log("sql1:" + sql);
    return await mySqlConn.runQuery({
      sql,
      values: [status, id]
    });
  };

  /**
   * @param {number}id
   * @param {number}password
   */
  const updateUserPswdById = async (id, password) => {
    console.log("id:" + id);
    console.log("password:" + password);
    let sql = ` UPDATE ums_admin SET password = ? WHERE id = ?`;
    console.log("sql1:" + sql);
    return await mySqlConn.runQuery({
      sql,
      values: [password, id]
    });
  };

  /**
   * @param {string}username
   * @param {object} updateObj: key value pair
   */
  const setLastLogin = async (username) => {
    let sql = ` UPDATE ums_admin SET login_time = now() WHERE username = ?`;
    return await mySqlConn.runQuery({
      sql,
      values: [username]
    });
  };
  /**
   * @param {number} offset
   * @param {number} limit
   */
  const getUserList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `select u1.id,u1.username,u1.icon,u1.email,u1.nick_name,u1.create_time,u1.login_time,u1.status,GROUP_CONCAT(u3.name SEPARATOR ',') role_name
    from ums_admin u1 
    left join ums_admin_role_relation u2 on u1.id = u2.admin_id
    left join ums_role u3 on u2.role_id = u3.id
    ${SQLpostfixGenerator(`${whereStr} GROUP BY u1.id`, req.query)}`;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_admin`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  /**
   * @param {number}Id
   *
   */
  const deleteUserById = async (id) => {
    let sql = `DELETE FROM ums_admin WHERE id = ?`;
    // return await mySqlConn.runQuery({
    //   sql,
    //   values: [id]
    // });

    let result = (
      await mySqlConn.runQuery({
        sql,
        values: [id]
      })
    ).result.affectedRows;

    // console.log('result....', JSON.stringify(result, null, 1));
    //  let data = JSON.stringify(result, null, 1).affectedRows;
    console.log("data....", result);
    return result;
  };

  /**
     * @param {number}Id
     *
     */
  const getRoleListByAdminId = async (id) => {
    let sql = `SELECT COUNT(id) AS total FROM ums_admin_role_relation WHERE admin_id = ?`;

    let result = (
      await mySqlConn.runQuery({
        sql,
        values: [id]
      })
    ).result[0].total;

    //  console.log('result....', JSON.stringify(result, null, 1));
    //  let data = JSON.stringify(result, null, 1).affectedRows;
    console.log("result....", result);
    return result;
  };

  /**
     * @param {number}Id
     *
     */
  const deleteUserRoleRelationByAdminId = async (id) => {
    let sql = `DELETE FROM ums_admin_role_relation WHERE admin_id = ?`;
    // return await mySqlConn.runQuery({
    //   sql,
    //   values: [id]
    // });

    let result = (
      await mySqlConn.runQuery({
        sql,
        values: [id]
      })
    ).result.affectedRows;

    // console.log('result....', JSON.stringify(result, null, 1));
    //  let data = JSON.stringify(result, null, 1).affectedRows;
    console.log("dataAdminRole....", result);
    return result;
  };

  const getLoginFail = async (userid) => {
    let sql = `SELECT * FROM ums_admin_login_fail WHERE userid= ?`;
    let { result } = await mySqlConn.runQuery({
      sql,
      values: [userid]
    });
    return result[0];
  };

  const setLoginFail = async (failLog, user) => {
    // console.log(failLog, user);
    let config = {}, result = {};
    // if有失败记录（因为之前的逻辑，若ban_time未超时则直接返回，所以能到这里必定是ban_time超时了）
    if (failLog) {
      // if失败时间小于当前时间15分钟前
      if (failLog.fin_fail_time < moment().subtract(15, 'm').unix()) {
        config = {
          fail_times: 1,
          fin_fail_time: moment().unix(),
        }
      }
      // if已失败次数不足4, +1
      else if (failLog.fail_times < 4) {
        config = {
          fail_times: failLog.fail_times + 1,
          fin_fail_time: moment().unix(),
        }
        // if已失败次数为4，那么这次是第五次，封它
      } else if (failLog.fail_times == 4) {
        config = {
          fail_times: 5,
          fin_fail_time: moment().unix(),
          ban_time: moment().add(15, "m").unix()
        }
        // if已失败次数为5，那么之前已经封过了，置1
      } else {
        config = {
          fail_times: 1,
          fin_fail_time: moment().unix(),
        }
      }
      result = await mySqlConn.runQuery({
        sql: `UPDATE ums_admin_login_fail SET ? WHERE userid= ? `,
        values: [config, failLog.userid]
      });
    } else {
      config = {
        userid: user.id,
        fail_times: 1,
        fin_fail_time: moment().unix(),
      }
      result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_admin_login_fail SET ? `,
        values: config
      });
    }
    console.log(config);
    return result[0];
  };
  const getUserByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT id,username,email,status FROM ums_admin WHERE id = '${req.params.id}'`
      })
    ).result;
  };

  const updateUserByID = async (req) => {
    const { id, ...config } = req.body;
    let result = await mySqlConn.runQuery({
      sql: `UPDATE ums_admin SET ? WHERE id= ? `,
      values: [config, id]
    });
    return `update ums_admin, result: ${result}`;
  };
  return {
    insertUser,
    findByUserName,
    updateUserByUsername,
    setLastLogin,
    getUserList,
    deleteUserById,
    updateUserStatusById,
    getRoleListByAdminId,
    deleteUserRoleRelationByAdminId,
    updateUserPswdById,
    getLoginFail,
    setLoginFail,
    getUserByID,
    updateUserByID
  };
};
