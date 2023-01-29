const mysql = require("../common/mysql");
const {
    getListBySQL,
    SQLpostfixGenerator,
    whereStrGenerator
} = require("../common/modelHelper.js");
const mySqlConn = mysql({ dbname: "daas" });

module.exports = function user() {
    let that = this;
    that.getDeskManager = async (req) => {
        let whereStr = "WHERE a.is_delete=0";
        whereStr = whereStrGenerator(whereStr, req.query, {
            name: 'a.name'
        });
        let sql = `SELECT 
        a.id,a.server_id,a.name,a.desc,a.userid,
        b.name as os_name,
        c.name as spec_name,
        r.name AS region_name
        FROM daas_user_host a 
        LEFT JOIN daas_host_os b ON a.osid = b.id 
        LEFT JOIN daas_host_spec c ON a.specid = c.id 
        LEFT JOIN daas_region r ON a.region_id = r.id 
            ${SQLpostfixGenerator(whereStr, req.query, {
            name: 'a.name'
        })} `;
        let getCountSql = `SELECT COUNT(a.id) AS total
        FROM daas_user_host a 
        LEFT JOIN daas_host_os b ON a.osid = b.id 
        LEFT JOIN daas_host_spec c ON a.specid = c.id 
        LEFT JOIN daas_region r ON a.region_id = r.id 
            ${whereStr}`;
        return getListBySQL(sql, getCountSql, mySqlConn);
    };
    return that;
};