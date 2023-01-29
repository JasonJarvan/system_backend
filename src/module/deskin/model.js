const mysql = require("../common/mysql");
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator
} = require("../common/modelHelper.js");
const { getLanguageCodeByCode } = require("../../utils/languageCode");
module.exports = function model() {
  const mySqlConn = mysql({ dbname: "admin", multipleStatements: true });
  const that = this;
  that.getTranslateList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    const sql = `SELECT * FROM ums_deskin_translate 
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    const getCountSql = `SELECT COUNT(1) AS total FROM ums_deskin_translate ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.updateTranslate = async (req) => {
    const data = {};
    const keys = [
      "language",
      "translate_key",
      "translate_source",
      "translate_result"
    ];
    for (const key in req.body) {
      if (keys.includes(key)) {
        data[key] = req.body[key];
      }
    }
    await mySqlConn.runQuery({
      sql: `UPDATE ums_deskin_translate SET ? WHERE id = ?`,
      values: [data, req.body.id]
    });
    return true;
  };
  const batchAdd = async (list) => {
    return await Promise.allSettled(
      list.map((item) => {
        return new Promise((resolve, reject) => {
          mySqlConn
            .runQuery({
              sql: `INSERT INTO ums_deskin_translate SET ?`,
              values: [item]
            })
            .then(() =>
              resolve({
                ...item,
                reason: "成功！",
                success: true
              })
            )
            .catch((error) => {
              if (error.code == "ER_DUP_ENTRY") {
                reject({
                  ...item,
                  reason: "该语言对应的key已存在！",
                  success: false
                });
              }
            });
        });
      })
    );
  };

  that.addTranslate = async (req) => {
    const { language, translate } = req.body;
    const result = await batchAdd(
      translate.map((item) => ({ language, ...item }))
    );
    const failed = result.filter((item) => item.status == "rejected");
    if (failed.length > 0) {
      return failed.map((item) => item.reason);
    }
  };
  that.deleteTranslate = async (id) => {
    await mySqlConn.runQuery({
      sql: `DELETE FROM ums_deskin_translate WHERE id = ?`,
      values: [id]
    });
    return `deleted`;
  };
  that.importTranslate = async (json) => {
    const list = [];
    const failed = [];
    for (const row of json) {
      const { key, en: source } = row;
      for (const language in row) {
        if ("key" !== language) {
          if (getLanguageCodeByCode(language)) {
            list.push({
              language,
              translate_key: key,
              translate_source: source,
              translate_result: row[language]
            });
          } else {
            failed.push({
              language,
              translate_key: key,
              translate_result: row[language],
              reason: "语言代码不存在！",
              success: false
            });
          }
        }
      }
    }
    const result = await batchAdd(list);
    return {
      result: result
        .map((item) => (item.status == "fulfilled" ? item.value : item.reason))
        .concat(failed)
    };
  };

  return that;
};
