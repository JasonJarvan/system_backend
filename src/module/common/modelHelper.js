const lodash = require("lodash");
const { escape: mysqlEscape } = require("mysql");

const getListBySQL = async (sql, getCountSql, mySqlConn) => {
  // try {
  console.log("sql= ", sql);
  let list = (
    await mySqlConn.runQuery({
      sql
    })
  ).result;
  console.log(getCountSql);
  let { total } = (
    await mySqlConn.runQuery({
      sql: getCountSql
    })
  ).result[0];
  let result = { list, total };
  // console.log(result);
  return result;
  // } catch (error) {
  //   console.log(error);
  //   return error;
  // }
};

const SQLpostfixGenerator = (whereStr, query, ambiguousKeys) => {
  let { limit, offset } = query;
  offset = offset ? parseInt(offset) : 0;
  limit = limit ? parseInt(limit) : 100;
  let limitStr = limit != -1 ? `LIMIT ${offset},${limit}` : ``;

  let orderStr = "";
  if (query?.options) {
    let { sorter } = JSON.parse(query.options);
    if (sorter && JSON.stringify(sorter) !== "{}") {
      let sorterStr = () => {
        let sorterStr = "";
        for (let key in sorter) {
          sorterStr += `${ambiguousHandler(ambiguousKeys, key)} ${sorter[key] == "ascend" ? "ASC" : "DESC"
            },`;
        }
        sorterStr = sorterStr.substring(0, sorterStr.lastIndexOf(","));
        return sorterStr;
      };
      orderStr = `ORDER BY ${sorterStr()}`;
    }
  }
  return `${whereStr} ${orderStr} ${limitStr}`;
};

/**
 * Generate whereStr by filter, dateRanger, searchKeys
 * @param {*} whereStr Generic string started by 'WHERE', usually is 'WHERE 1=1'
 * @param {*} query
 * @param {*} ambiguousKeys
 * @returns whereStr
 */
const whereStrGenerator = (whereStr, query, ambiguousKeys) => {
  if (!query || !query.options) return `${whereStr}`;

  let { filter, dateRanger, searchKeys } = JSON.parse(query.options);
  if (dateRanger && JSON.stringify(dateRanger) !== "{}") {
    for (let key in dateRanger) {
      if (dateRanger[key]) {
        dateRanger[key][0]
          ? (whereStr += ` AND ${ambiguousHandler(
            ambiguousKeys,
            key
          )} >= ${mysqlEscape(dateRanger[key][0])}`)
          : null;
        dateRanger[key][1]
          ? (whereStr += ` AND ${ambiguousHandler(
            ambiguousKeys,
            key
          )} <= ${mysqlEscape(dateRanger[key][1])}`)
          : null;
      }
    }
  }
  // 有模糊查询
  if (filter && JSON.stringify(filter) !== "{}" && searchKeys) {
    for (let key in filter) {
      // {isnull: null}代表查询NULL值
      if (lodash.isEqual(filter[key], { isnull: true })) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IS NULL`;
      } else if (lodash.isEqual(filter[key], { isnull: false })) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IS NOT NULL`;
      } else if (key === "phone" || key === "email") {
        // 海外电话和邮箱开头为“+”，此时会被传成" "，所以要特殊处理
        let value = filter[key];
        if (value && value[0] === " ") {
          value = value.replace(" ", "+");
        }
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IN (${Array.isArray(value)
          ? ("'" + value.join("','") + "'")
          : mysqlEscape(value)
          })`;
      } else if (filter[key] || filter[key] === 0 || filter[key] === false) {
        searchKeys.includes(key)
          ? (whereStr += ` AND IFNULL(${ambiguousHandler(
            ambiguousKeys,
            key
          )},'') LIKE CONCAT('%',${mysqlEscape(filter[key])},'%')`)
          : (whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IN (${Array.isArray(filter[key])
            ? ("'" + filter[key].join("','") + "'")
            : mysqlEscape(filter[key])
            })`);
      }
    }
    // 无模糊查询
  } else if (filter && JSON.stringify(filter) !== "{}") {
    for (let key in filter) {
      if (lodash.isEqual(filter[key], { isnull: true })) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IS NULL`;
      } else if (lodash.isEqual(filter[key], { isnull: false })) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IS NOT NULL`;
      } else if (filter[key] === null) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IS NULL`;
      } else if (key === "phone" || key === "email") {
        // 海外电话和邮箱开头为“+”，此时会被传成" "，所以要特殊处理
        let value = filter[key];
        if (value && value[0] === " ") {
          value = value.replace(" ", "+");
        }
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IN (${Array.isArray(value)
          ? ("'" + value.join("','") + "'")
          : mysqlEscape(value)
          })`;
      } else if (filter[key] || filter[key] === 0 || filter[key] === false) {
        whereStr += ` AND ${ambiguousHandler(ambiguousKeys, key)} IN (${Array.isArray(filter[key])
          ? ("'" + filter[key].join("','") + "'")
          : mysqlEscape(filter[key])
          })`;
      }
    }
  }
  return `${whereStr}`;
};

/**
 * There are same column names in two joint tables, and will cause ambiguous error.
 * @param {*} ambiguousKeys
 * @param {*} key
 * @returns
 */
const ambiguousHandler = (ambiguousKeys, key) => {
  return ambiguousKeys ? (ambiguousKeys[key] ? ambiguousKeys[key] : key) : key;
};

const converDataListToObject = function (dataList) {
  const result = {};
  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];
    result[data.config_name] = data.config_value;
  }
  return result;
};
const whenThenGenerator = (configs) => {
  let whenThenStr = "";
  for (let key in configs) {
    whenThenStr += `WHEN '${key}' then '${configs[key]}'
    `;
  }
  whenThenStr += `END `;
  return whenThenStr;
};
const inGenerator = (configs) => {
  let inStr = `(`;
  for (let key in configs) {
    inStr += `'${key}',`;
  }
  inStr = inStr.substring(0, inStr.length - 1);
  inStr += `)`;
  console.log(configs, inStr);
  return inStr;
};

module.exports = {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator,
  converDataListToObject,
  whenThenGenerator,
  inGenerator
};
