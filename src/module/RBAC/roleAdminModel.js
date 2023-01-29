const mysql = require("../common/mysql");
const TABLENAME_ADMIN = "ums_admin";
const TABLENAME_ROLE = "ums_role";
const TABLENAME_PERMISSION = "ums_permission";
const TABLENAME_ROLE_PERMISSION = "ums_role_permission_relation";
const TABLENAME_ROLE_ADMIN = "ums_admin_role_relation";
const ROLE_RESOURCE_TABLE = "ums_role_resource_relation"
const RESOURCE_TABLE = "ums_resource"
function role() {
    let mySqlConn = mysql({ dbname: "admin" });
    const createRelation = async ({ roleId, adminId }) => {
        let sql = `INSERT INTO ${TABLENAME_ROLE_ADMIN} SET role_id=? , admin_id =?`
        return await mySqlConn.runQuery(
            {
                sql,
                values: [roleId, adminId]
            }
        )
    }
    const deleteRelation = async ({ roleId, adminId }) => {
        let sql = `DELETE FROM ${TABLENAME_ROLE_ADMIN} WHERE role_id=? and admin_id =?`
        return await mySqlConn.runQuery(
            {
                sql,
                values: [roleId, adminId]
            }
        )
    }

    const fetchRelation = async (adminid) => {
        let table = `SELECT * FROM ${TABLENAME_ROLE_ADMIN} WHERE admin_id=?`
        //let sql = `SELECT t1.id as id,t1.name as name, (IF t2.admin_id IS NULL,false,true) as hasPermit FROM ${TABLENAME_ROLE} t1 LEFT JOIN  (${table}) t2 ON t1.id=t2.role_id`
        let sql = `SELECT t1.id as id ,t1.name as name,t1.description as description,t1.sort as sort,IF(t2.admin_id IS NULL,false,true) as hasPermit FROM ${TABLENAME_ROLE} t1 LEFT JOIN  (${table}) t2 ON t1.id=t2.role_id`
        let { result } = await mySqlConn.runQuery(
            {
                sql,
                values: [adminid]
            }
        )
        return result
    }
    return {
        deleteRelation, createRelation, fetchRelation
    }

}

module.exports = role