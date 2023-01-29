const mysql = require("../common/mysql");
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");

module.exports = function role() {
  let mySqlConn = mysql({ dbname: "admin" });

  const getRole = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id,name,description,admin_count,create_time,status FROM ums_role 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_role ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  const updateRole = async (role) => {
    if (role.id) {
      return await mySqlConn.runQuery({
        sql: `UPDATE ums_role SET status=?,name=?, description=? WHERE id=? `,
        values: [role.status, role.name, role.description, role.id]
      });
    } else {
      return await mySqlConn.runQuery({
        sql: `INSERT INTO ums_role SET create_time=now(), admin_count=0, status=1, ? `,
        values: role
      });
    }
  };

  const deleteRole = async (roleId) => {
    return await mySqlConn.runQuery({
      sql: `DELETE FROM ums_role WHERE id=? `,
      values: [roleId]
    });
  };

  const getPermission = async (pid, type = 0) => {
    let sql = `SELECT * FROM ums_permission where type=?`;
    if (pid && pid != "undefined") {
      sql = sql + "and pid=?";
    }
    let { result } = await mySqlConn.runQuery({
      sql,
      values: [type, pid]
    });
    return result;
  };
  const updatePermission = async (permission) => {
    let id = permission.id;
    delete permission["id"];
    if (id) {
      await mySqlConn.runQuery({
        sql: `UPDATE ums_permission SET ? WHERE id=? `,
        values: [permission, id]
      });
      return "update permission";
    } else {
      await mySqlConn.runQuery({
        sql: `INSERT INTO ums_permission SET create_time=now(), status=1, ? `,
        values: permission
      });
      return "insert permission";
    }
  };

  const deletePermission = async (id) => {
    // 删除权限时，删除权限下的所有子权限
    await mySqlConn.runQuery({
      sql: `DELETE FROM ums_permission WHERE id=? OR pid=?`,
      values: [id, id]
    });
    // 删除权限关联表
    await mySqlConn.runQuery({
      sql: `DELETE FROM ums_role_permission_relation WHERE permission_id=? `,
      values: [id]
    });
    return true;
  };

  /**
   * @param {string}roleId
   */
  const getRolePermission = async (roleId) => {
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_permission WHERE id IN (SELECT permission_id FROM ums_role_permission_relation WHERE role_id=?)`,
      values: [roleId]
    });
    return result;
  };

  const updateRolePermission = async ({ roleId, permissionIdList }) => {
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_role_permission_relation WHERE role_id = ?`,
      values: [roleId]
    });
    const currentRolePermission = result.map((l) => l.permission_id);
    let insertIdList = [];
    let deleteIdList = [];
    for (let i = 0; i < currentRolePermission.length; i++) {
      const id = currentRolePermission[i];
      if (!permissionIdList.includes(id)) {
        deleteIdList.push(id);
      }
    }
    for (let i = 0; i < permissionIdList.length; i++) {
      const id = permissionIdList[i];
      if (!currentRolePermission.includes(id)) {
        insertIdList.push(id);
      }
    }
    if (deleteIdList.length > 0) {
      const { result } = await mySqlConn.runQuery({
        sql: `DELETE FROM ums_role_permission_relation WHERE role_id=? AND permission_id IN (?)`,
        values: [roleId, deleteIdList]
      });
    }
    if (insertIdList.length > 0) {
      const { result } = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_role_permission_relation(role_id, permission_id) VALUES ? `,
        values: [insertIdList.map((l) => [roleId, l])]
      });
    }
  };
  /**
   * @param {string}roleId
   */
  const getRoleAdmin = async (roleId) => {
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT id,username,icon,email,nick_name,create_time,login_time,status FROM ums_admin WHERE id IN (SELECT admin_id FROM ums_admin_role_relation WHERE role_id=?)`,
      values: [roleId]
    });
    return result;
  };

  const updateRoleAdmin = async ({ roleId, adminIdList }) => {
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_admin_role_relation WHERE role_id=?`,
      values: [roleId]
    });
    const current = result.map((l) => l.admin_id);
    let insertIdList = [];
    let deleteIdList = [];
    for (let i = 0; i < current.length; i++) {
      const id = current[i];
      if (!adminIdList.includes(id)) {
        deleteIdList.push(id);
      }
    }
    for (let i = 0; i < adminIdList.length; i++) {
      const id = adminIdList[i];
      if (!current.includes(id)) {
        insertIdList.push(id);
      }
    }
    if (deleteIdList.length > 0) {
      await mySqlConn.runQuery({
        sql: `DELETE FROM ums_admin_role_relation WHERE role_id=? AND admin_id IN (?)`,
        values: [roleId, deleteIdList]
      });
    }
    if (insertIdList.length > 0) {
      await mySqlConn.runQuery({
        sql: `INSERT INTO ums_admin_role_relation(role_id, admin_id) VALUES ? `,
        values: [insertIdList.map((l) => [roleId, l])]
      });
    }
    await mySqlConn.runQuery({
      sql: `UPDATE ums_role SET admin_count=(SELECT COUNT(1) FROM ums_admin_role_relation WHERE role_id=?) WHERE id=?`,
      values: [roleId, roleId]
    });
  };

  return {
    getRole,
    getPermission,
    getRolePermission,
    getRoleAdmin,
    updateRole,
    updatePermission,
    updateRolePermission,
    updateRoleAdmin,
    deleteRole,
    deletePermission
  };
};
