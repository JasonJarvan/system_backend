const mysql = require("../common/mysql");
const TABLENAME_ROLE_PERMISSION = "ums_role_permission_relation";
module.exports = function role() {
  const mySqlConn = mysql({ dbname: "admin" });
  const createRelation = async ({ roleId, permissionId }) => {
    const values = permissionId.map((id) => `(${roleId},${id})`).join();
    return await mySqlConn.runQuery({
      sql: `INSERT INTO ${TABLENAME_ROLE_PERMISSION} (role_id,permission_id) VALUES ${values}`
    });
  };
  const deleteRelation = async ({ roleId, permissionId }) => {
    return await mySqlConn.runQuery({
      sql: `DELETE FROM ${TABLENAME_ROLE_PERMISSION} WHERE role_id=? and permission_id IN (?)`,
      values: [roleId, permissionId]
    });
  };
  return {
    deleteRelation,
    createRelation
  };
};
