const mysql = require("../common/mysql");
const TABLENAME_VERSION = "ums_abtest_version";
const TABLENAME_GRAY = "ums_abtest_gray";
const TABLENAME_STRATEGY = "ums_abtest_strategy";
const mySqlConn = mysql({ dbname: "admin" });

const getVersionList = async (offset = 0, limit = 20) => {
  const sql = `SELECT a.*, MAX(b.start_time) gray_start_time,
  IF((CURRENT_TIMESTAMP > MAX(b.start_time)), IF((CURRENT_TIMESTAMP < MAX(b.end_time)), 1, 2), 0) gray_status
  FROM ${TABLENAME_VERSION} a LEFT JOIN ${TABLENAME_GRAY} b ON a.id = b.version_id GROUP BY a.id ORDER BY a.id DESC LIMIT ?,?`;
  const { result: list } = await mySqlConn.runQuery({
    sql,
    values: [Number(offset), Number(limit)]
  });
  const { total } = (
    await mySqlConn.runQuery({
      sql: `SELECT COUNT(id) AS total FROM ${TABLENAME_VERSION}`
    })
  ).result[0];
  let result = { list, total };
  return result;
};

const getVersion = async (versionId) => {
  const sql = `SELECT a.*, MAX(b.start_time) gray_start_time,
  IF((CURRENT_TIMESTAMP > MAX(b.start_time)), IF((CURRENT_TIMESTAMP < MAX(b.end_time)), 1, 2), 0) gray_status
  FROM ${TABLENAME_VERSION} a LEFT JOIN ${TABLENAME_GRAY} b ON a.id = b.version_id WHERE a.id = ? GROUP BY a.id `;
  const { result } = await mySqlConn.runQuery({ sql, values: [versionId] });
  return result.length > 0 ? result[0] : {};
};

/**
 *
 * @param {Array} keyArray
 * @param {Object} data
 * @returns {[String, Array]} [keyString, values]
 */
const generateKeyValues = (keyArray, data) => {
  const keys = [],
    values = [];
  keyArray.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keys.push(key + "=?");
      values.push(data[key]);
    }
  });
  return [keys.toString(), values];
};

const updateVersion = async (versionData) => {
  if (versionData.id) {
    const [keyString, values] = generateKeyValues(
      ["version_update_log", "release_status", "release_time"],
      versionData
    );
    values.push(versionData.id);
    return await mySqlConn.runQuery({
      sql: `UPDATE ${TABLENAME_VERSION} SET ${keyString} WHERE id=? `,
      values
    });
  } else {
    return await mySqlConn.runQuery({
      sql: `INSERT INTO ${TABLENAME_VERSION} SET ? `,
      values: versionData
    });
  }
};

const deleteVersion = async (versionId) => {
  return await mySqlConn.runQuery({
    sql: `DELETE a,b,c FROM ${TABLENAME_VERSION} a LEFT JOIN ${TABLENAME_GRAY} b ON a.id = b.version_id LEFT JOIN ${TABLENAME_STRATEGY} c ON b.id = c.gray_id WHERE a.id = ?`,
    values: [versionId]
  });
};

const getVersionGray = async (versionId) => {
  const { result } = await mySqlConn.runQuery({
    sql: `SELECT *, IF((CURRENT_TIMESTAMP < start_time), 0, IF((CURRENT_TIMESTAMP < end_time), 1, 2)) AS gray_status FROM ${TABLENAME_GRAY} WHERE version_id=? `,
    values: [versionId]
  });
  const { result: strategyList } = await mySqlConn.runQuery({
    sql: `SELECT a.* FROM ${TABLENAME_STRATEGY} a,${TABLENAME_GRAY} b WHERE a.gray_id = b.id AND b.version_id=?`,
    values: [versionId]
  });
  result.forEach((e) => {
    e.strategy = strategyList.filter((s) => s.gray_id == e.id);
  });
  return result;
};

const updateVersionGray = async (grayData) => {
  const [keyString, values] = generateKeyValues(
    ["name", "start_time", "end_time", "status"],
    grayData
  );
  values.push(grayData.id);
  return await mySqlConn.runQuery({
    sql: `UPDATE ${TABLENAME_GRAY} SET ${keyString} WHERE id=? `,
    values
  });
};

const addVersionGray = async (grayDataList) => {
  for (let i = 0; i < grayDataList.length; i++) {
    const grayData = grayDataList[i];
    const { result } = await mySqlConn.runQuery({
      sql: `INSERT INTO ${TABLENAME_GRAY} SET ? `,
      values: {
        version_id: grayData.version_id,
        name: grayData.name,
        start_time: grayData.start_time,
        end_time: grayData.end_time
      }
    });
    const id = result.insertId;
    const resp = await mySqlConn.runQuery({
      sql: `INSERT INTO ${TABLENAME_STRATEGY} (gray_id,relation,type,value) VALUES ? `,
      values: [grayData.strategy.map((s) => [id, s.relation, s.type, s.value])]
    });
  }
};

const deleteVersionGray = async (grayId) => {
  return await mySqlConn.runQuery({
    sql: `DELETE a,b FROM ${TABLENAME_GRAY} a LEFT JOIN ${TABLENAME_STRATEGY} b ON a.id = b.gray_id WHERE a.id = ?`,
    values: [grayId]
  });
};

module.exports = {
  getVersion,
  getVersionList,
  updateVersion,
  deleteVersion,
  getVersionGray,
  updateVersionGray,
  addVersionGray,
  deleteVersionGray
};
