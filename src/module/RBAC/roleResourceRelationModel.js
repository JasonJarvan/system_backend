const mysql = require("../common/mysql");
const TABLENAME_ADMIN = "ums_admin";
const TABLENAME_ROLE = "ums_role";
const TABLENAME_PERMISSION = "ums_permission";
const TABLENAME_ROLE_PERMISSION = "ums_role_permission_relation";
const TABLENAME_ROLE_ADMIN = "ums_admin_role_relation";
const ROLE_RESOURCE_TABLE = "ums_role_resource_relation"
const RESOURCE_TABLE = "ums_resource"
module.exports = function role() {
    let mySqlConn = mysql({ dbname: "admin" });
    const createRelation = async ({ roleId, resourceId }) => {
        let sql = `INSERT INTO ${ROLE_RESOURCE_TABLE} SET ?`
        return await mySqlConn.runQuery(
            {
                sql,
                values: { role_id: roleId, resource_id: resourceId }
            }
        )
    }
    const deleteRelation = async ({ roleId, resourceId }) => {
        let sql = `DELETE FROM ${ROLE_RESOURCE_TABLE} WHERE role_id=? and resource_id =?`
        return await mySqlConn.runQuery(
            {
                sql,
                values: [roleId, resourceId]
            }
        )
    }
    return {
        deleteRelation, createRelation
    }

}