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
    const createOrUpdateResource = async (resource) => {
        let id = resource.id
        let query = {
            sql: `INSERT INTO ${RESOURCE_TABLE} SET create_time=now(),?`,
            values: resource
        }
        if (resource.id) {
            delete resource["id"]
            query.sql = `UPDATE ${RESOURCE_TABLE} SET ? WHERE id=?`
            query.values = [resource, id]
        }
        return await mySqlConn.runQuery(query)
    }
    const getResources = async (offset = 0, limit = 20) => {
        let query = {
            sql: `SELECT * from ${RESOURCE_TABLE} `,
            values: [offset, limit]
        }
        let { result: list } = await mySqlConn.runQuery(query)
        let { total } = (
            await mySqlConn.runQuery({
                sql: `SELECT COUNT(id) AS total FROM ${RESOURCE_TABLE}`
            })
        ).result[0];
        return { list, total }
    }
    const deleteResource = async (id) => {
        let query = {
            sql: `DELETE FROM ${RESOURCE_TABLE} WHERE id=?`,
            values: [id]
        }
        let { result } = await mySqlConn.runQuery(query)
        return result
    }
    const getResourcebyRoleid = async (roleid) => {
        let secTable = `SELECT resource_id FROM ${ROLE_RESOURCE_TABLE} WHERE role_id=?`
        let sql = `SELECT t1.id as id, t1.name as name, t1.description as discription, IF(resource_id is NULL, false, true) as havePermission FROM ${RESOURCE_TABLE} t1 LEFT JOIN (${secTable}) t2 ON t1.id=t2.resource_id`
        let { result } = await mySqlConn.runQuery({
            sql,
            values: [
                roleid
            ]
        });
        return result;
    };
    return {
        deleteResource,
        getResources,
        createOrUpdateResource, getResourcebyRoleid

    }
}