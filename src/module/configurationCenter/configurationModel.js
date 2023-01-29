const mysql = require("../common/mysql");
const mySqlConn = mysql({ dbname: "admin", multipleStatements: true });
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator,
  converDataListToObject,
  whenThenGenerator,
  inGenerator
} = require("../common/modelHelper.js");
const { isJSON, formatJSONString, formatJsonToHTML } = require("../../utils/common");
const api = require("./api");
const moment = require("moment");
const lodash = require("lodash");

const getConfigModel = async (req, config_type) => {
  let whereStr = `WHERE config_type IN (${config_type})`;
  whereStr = whereStrGenerator(whereStr, req.query);
  let sql = `SELECT * FROM ums_configuration
  ${SQLpostfixGenerator(whereStr, req.query)} `;
  let getCountSql = `SELECT COUNT(id) AS total FROM ums_configuration
  ${whereStr}`;
  return getListBySQL(sql, getCountSql, mySqlConn);
};

const getConfigByIDModel = async (req) => {
  return (
    await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_configuration WHERE id = '${req.params.id}'`
    })
  ).result;
};

const updateConfigModel = async (configCopy, config_type) => {
  let config = { ...configCopy };
  let id = config.id;
  delete config["id"];
  if (id) {
    let result = await mySqlConn.runQuery({
      sql: `UPDATE ums_configuration SET ? WHERE id= ? `,
      values: [config, id]
    });
    return `update config, result: ${result}`;
  } else {
    config.config_type = config_type;
    let result = await mySqlConn.runQuery({
      sql: `INSERT INTO ums_configuration SET ? `,
      values: config
    });
    return `insert config, result: ${result}`;
  }
};

const updateVersionConfig = async (config) => {
  let sql = `UPDATE ums_configuration SET config_value = 
    CASE config_version
    WHEN 'version' THEN '${config.version}'
    WHEN 'link' THEN '${config.link}'
    WHEN 'updateContent' THEN '${config.updateContent}'
    WHEN 'updateType' THEN '${config.updateType}'
    END
  WHERE config_name = '${config.config_name}' `;
  let result = await mySqlConn.runQuery({
    sql
  });
  return `update config, result: ${result}`;
};

const deleteConfigModel = async (id) => {
  const { result } = await mySqlConn.runQuery({
    sql: `DELETE FROM ums_configuration WHERE id = ? `,
    values: [id]
  });
  return result;
};

/**
 * 同步下发方案和下发分组之间的关联
 * @param {*} configid 下发方案的ID
 * @param {*} dp_concat 下发方案的下发分组关联数组
 * @param {*} isUpdate 是否是更新下发方案
 */
const syncConfigGroup = async (configid, dp_concat, isUpdate) => {
  let boundingGroupIDs = [];
  // 根据dp_concat同步下发方案和下发分组的关联
  if (dp_concat) {
    let groupRank = JSON.parse(dp_concat);
    groupRank.forEach(async (element, index) => {
      boundingGroupIDs.push(element.value);
      await mySqlConn.runQuery({
        sql: `UPDATE ums_dispatch_group SET dg_configid = ${configid}, dg_ordernum = ${index} WHERE id= ${element.value} `
      });
    });
  }
  // 将已解绑的分组配置和关联删除
  await mySqlConn.runQuery({
    sql: `UPDATE ums_dispatch_group SET dg_configid = NULL, dg_ordernum = NULL WHERE dg_configid= ${configid} 
    ${boundingGroupIDs.length
        ? `AND id NOT IN ('${boundingGroupIDs.join("','")}')`
        : ""
      }`
  });
};

/**
 * 同步下发方案和管理员之间的关联
 * @param {*} configid 下发方案的ID
 * @param {*} dp_admin 下发方案的管理员关联数组,e.g. [{"label":"zhaosheng","value":51,"key":51},{"label":"shenpi","value":"17","key":"17"}]
 * @param {*} isUpdate 是否是更新下发方案
 */
const syncConfigAdmin = async (configid, dp_admin, isUpdate) => {
  // 删除所有该下发方案的关联项
  await mySqlConn.runQuery({
    sql: `DELETE FROM ums_dispatchconfig_admin_relation WHERE dispatch_id = ${configid}`
  });
  // 根据dp_admin同步下发方案和管理员的关联
  if (dp_admin) {
    let groupRank = JSON.parse(dp_admin);
    // 不能直接用groupRank.foreach，因为forEach本身是异步操作。要用for await。
    for await (element of groupRank) {
      await mySqlConn.runQuery({
        sql: `INSERT IGNORE INTO ums_dispatchconfig_admin_relation
        SET dispatch_id = ${configid}, admin_id = ${element.value}`
      })
    }
    // 下面是另一种写法
    // return Promise.all(groupRank.map((element, index) => (mySqlConn.runQuery({
    //   sql: `INSERT IGNORE INTO ums_dispatchconfig_admin_relation
    //   SET dispatch_id = ${configid}, admin_id = ${element.value}`
    // }))))
  }
};

/**
 * 判断下发方案的配置是否存在相同的key
 * @param {} config
 */
const checkDupConfig = async (config) => {
  let dp_merge = JSON.parse(config.dp_merge);
  let dp_mergeKeys = Object.keys(dp_merge);
  let likeSql = `SELECT id, dp_merge FROM ums_dispatch_config 
  WHERE dp_delete = 0 AND dp_domain ${config.dp_domain ? `= "${config.dp_domain}"` : "IS NULL"
    } 
  ${config.id ? ` AND id != ${config.id}` : ""} 
  ${dp_mergeKeys && dp_mergeKeys.length
      ? `AND dp_merge REGEXP '${dp_mergeKeys.join("|")}'`
      : ""
    }`;
  console.log(likeSql);
  let likeResult = (await mySqlConn.runQuery({ sql: likeSql })).result;
  let likeKeySet = new Set();
  likeResult.forEach((item) => {
    // 若搜索到的记录中有非JSON格式字符串，则舍弃
    if (isJSON(item.dp_merge)) {
      let currentDpMergeKeys = Object.keys(JSON.parse(item.dp_merge));
      likeKeySet = new Set([...currentDpMergeKeys, ...likeKeySet]);
    }
  });
  let dupKeys = [];
  dp_mergeKeys.forEach((item) => {
    if (likeKeySet.has(item)) {
      dupKeys.push(item);
    }
  });
  if (dupKeys.length) {
    // throw new Error(`存在重复的key:${dupKeys.join(",")}`);
    return `存在重复的key:${dupKeys.join(",")}`;
  }
};

/**
 * 获取req的用户的角色ID队列字符串
 * @param {*} req
 * @returns e.g."1,6,12,13"
 */
const getUserRoleIDs = async (req) => {
  const userResult = (
    await mySqlConn.runQuery({
      sql: `SELECT a.id, a.username, c.admin_id, c.role_id, r.name
    FROM ums_admin AS a 
    LEFT JOIN ums_admin_role_relation AS c ON a.id = c.admin_id
    LEFT JOIN ums_role AS r ON c.role_id = r.id
    WHERE a.id = ${req.user.id}`
    })
  ).result;
  let userRoleIDs = [];
  userResult.forEach((val, ind) => {
    userRoleIDs.push(val.role_id);
  });
  const userRoleIDsStr = userRoleIDs.join(",");
  return userRoleIDsStr;
};

/**
 * 根据下发方案ID获取下发方案及其管理员列表
 * @param {*} configid 下发方案ID
 * @returns {object}
 */
const getDispatchConfigFullInfoByID = async (configid) => {
  const config = (
    await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_dispatch_config WHERE id = '${configid}'`
    })
  ).result[0];
  config.dp_admin = (
    await mySqlConn.runQuery({
      sql: `SELECT group_concat(a.username) AS usernames
      FROM ums_admin AS a
      LEFT JOIN ums_dispatchconfig_admin_relation AS r ON a.id = r.admin_id 
    WHERE r.dispatch_id ='${configid}'`
    })
  ).result[0].usernames;
  return config;
}

/**
 * 将下发方案Object转为可读带缩进换行的JSON字符串
 * @param {object} config 
 * @returns {string}
 */
const parseDispatchConfig = (config) => {
  const dispatchConfigLabelMap = {
    "id": "方案ID",
    "dp_name": "名称",
    "dp_value": "过滤条件",
    "dp_merge": "配置JSON",
    "dp_desc": "描述",
    "dp_concat": "下发分组",
    "dp_domain": "管理域",
    "dp_startTime": "开始时间",
    "dp_endTime": "结束时间",
    "dp_state": "下发状态",
    "dp_delete": "删除状态",
    "updateTime": "更新时间",
    "dp_admin": "管理员"
  }
  const dpStateLabelMap = {
    0: '待下发',
    1: '下发完成'
  }
  const dpDeleteLabelMap = {
    0: '未删除',
    1: '已删除'
  }
  const dpDomainLabelMap = {
    Client: '客户端【专业版】',
    TOB: '客户端【企业版】',
    deskin: '客户端【海外版】',
    AVBackend: '媒体后台',
  }
  const { dp_value, dp_concat, dp_merge, dp_startTime, dp_endTime, dp_state, dp_delete, dp_domain, ...vals } = config;
  let configParsed = {
    ...vals,
    // dp_value: dp_value ? formatJSONString(dp_value) : null,
    // dp_concat: dp_concat ? formatJSONString(dp_concat) : null,
    // dp_merge: dp_merge ? formatJSONString(dp_merge) : null,
    // dp_value: dp_value ? formatJsonToHTML(JSON.parse(dp_value)) : null,
    // dp_concat: dp_concat ? formatJsonToHTML(JSON.parse(dp_concat)) : null,
    // dp_merge: dp_merge ? formatJsonToHTML(JSON.parse(dp_merge)) : null,
    dp_value,
    dp_concat,
    dp_merge,
    dp_startTime: moment(dp_startTime).format('YYYY-MM-DD HH:mm:ss'),
    dp_endTime: moment(dp_endTime).format('YYYY-MM-DD HH:mm:ss'),
    dp_state: dpStateLabelMap[dp_state],
    dp_delete: dpDeleteLabelMap[dp_delete],
    dp_domain: dpDomainLabelMap[dp_domain]
  }
  configParsed = lodash.mapKeys(configParsed, (value, key) => dispatchConfigLabelMap[key]);
  return formatJsonToHTML(configParsed);
}

/**
 * 从dp_admin获取admin的邮件列表
 * @param {*} dp_admin e.g.[{"key":12,"value":12,"label":"wanglan"},{"key":19,"value":19,"label":"yegengyuan"}]
 */
const getEmailListBydp_admin = async (dp_admin) => {
  let adminIDList = JSON.parse(dp_admin).map((value) => value.key);
  let { result } = await mySqlConn.runQuery({
    sql: `SELECT email FROM ums_admin WHERE id IN ('${adminIDList.join("','")}') `
  })
  let adminEmailList = [];
  result.forEach((value) => {
    if (value.email) adminEmailList.push(value.email);
  })
  return adminEmailList;
}

/**
 * 发送下发方案变动的邮件
 * @param {Number} configid 下发方案ID
 * @param {string} dp_admin e.g.[{"key":12,"value":12,"label":"wanglan"},{"key":19,"value":19,"label":"yegengyuan"}]
 * @param {object} reqUser req.user
 * @param {object} configBefore 更改前的下发方案详情
 * @returns 
 */
const sendConfigChangeMail = async (configid, dp_admin, reqUser, configBefore) => {
  const data = {};
  let configAfter = await getDispatchConfigFullInfoByID(configid);
  configAfter.dp_admin = JSON.parse(dp_admin).map(value => value.label).join(',');
  if (configBefore) {
    data.content = `你管理的下发方案已被更改，操作管理员用户名：${reqUser.username}
    <br/>更改前：${parseDispatchConfig(configBefore)}
    <br/>更改后：${parseDispatchConfig(configAfter)}`
    data.title = `下发方案更改告警`;
  } else {
    data.content = `已创建由你管理的下发方案，操作管理员用户名：${reqUser.username}
    <br/>方案详情：${parseDispatchConfig(configAfter)}`
    data.title = "下发方案创建提醒";
  }
  data.mailto = await getEmailListBydp_admin(dp_admin);
  return api.sendCustomMail(data)
}

module.exports = function user() {
  let that = this;
  that.getSystemConfig = (req) => getConfigModel(req, "1");
  that.getFeatureConfig = (req) => getConfigModel(req, "2");
  that.getABTestConfig = (req) => getConfigModel(req, "3");
  that.getVersionConfig = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_configuration WHERE config_type IN (4)`
      })
    ).result;
  };
  that.getCenterConfig = async (req) => {
    let whereStr = `WHERE config_type = 5 AND config_name != 'centerConfigTemp'`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, config_name, config_desc FROM ums_configuration
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_configuration
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getCenterConfigByID = (req) => getConfigByIDModel(req);
  that.getCenterConfigTemp = async (req, res) => {
    let list = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_configuration WHERE config_name = 'centerConfigTemp'`
      })
    ).result;
    return list;
  };
  that.getDispatchConfig = async (req) => {
    let whereStr = `WHERE dp_delete = 0`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, dp_name, dp_desc, dp_domain, dp_state, union_key, union_priority 
    FROM ums_dispatch_config
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_dispatch_config
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getDispatchConfigByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_dispatch_config WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  that.getDispatchGroup = async (req) => {
    let unbounded = req.query?.options
      ? JSON.parse(req.query.options).unbounded
      : undefined;
    let whereStr = `WHERE dg_delete = 0 ${unbounded ? "AND dg_configid IS NULL" : ""
      }`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT id, dg_name, dg_desc, dg_configid, dg_ordernum FROM ums_dispatch_group
    ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_dispatch_group
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getDispatchGroupByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT g.*, c.dp_merge
      FROM ums_dispatch_group AS g 
      LEFT JOIN ums_dispatch_config AS c ON g.dg_configid = c.id
      WHERE g.id = '${req.params.id}'`
      })
    ).result;
  };
  that.getDispatchConfigAdmin = async (req) => {
    let whereStr = `WHERE status = 1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT a.id, a.username, group_concat(r.dispatch_id) AS dispatchids 
    FROM ums_admin AS a
    LEFT JOIN ums_dispatchconfig_admin_relation AS r ON a.id = r.admin_id 
    ${SQLpostfixGenerator(`${whereStr} GROUP BY a.id`, req.query)}`;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_admin
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  that.getAdminByDispatchConfig = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT a.id, a.username
        FROM ums_admin AS a
        LEFT JOIN ums_dispatchconfig_admin_relation AS r ON a.id = r.admin_id 
      WHERE r.dispatch_id = '${req.params.id}'`
      })
    ).result;
  };

  that.updateSystemConfig = (req) => updateConfigModel(req.body, 1);
  that.updateFeatureConfig = (req) => updateConfigModel(req.body, 2);
  that.updateABTestConfig = (req) => updateConfigModel(req.body, 3);
  that.updateVersionConfig = (req) => updateVersionConfig(req.body);
  that.updateCenterConfig = (req) => updateConfigModel(req.body, 5);
  that.updateDispatchConfig = async (req) => {
    let { dp_admin, ...config } = { ...req.body };
    // console.log(dp_admin);
    let checkDupString = '';
    if (config.dp_merge) {
      if (!isJSON(config.dp_merge)) throw new Error("配置字符串非JSON格式！");
      checkDupString = await checkDupConfig(config);
    }
    let id = config.id;
    delete config["id"];
    let result, mailResult;
    if (id) {
      const configBefore = await getDispatchConfigFullInfoByID(id);
      result = await mySqlConn.runQuery({
        sql: `UPDATE ums_dispatch_config SET ? WHERE id= ? `,
        values: [config, id]
      });
      syncConfigGroup(id, config.dp_concat, true);
      syncConfigAdmin(id, dp_admin, true);
      if (dp_admin) mailResult = sendConfigChangeMail(id, dp_admin, req.user, configBefore)
        .then(res => console.log('下发方案邮件提醒发送情况：', res));
    } else {
      result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_dispatch_config SET ? `,
        values: config
      });
      id = result.result.insertId;
      syncConfigGroup(id, config.dp_concat);
      syncConfigAdmin(id, dp_admin);
      if (dp_admin) mailResult = sendConfigChangeMail(id, dp_admin, req.user)
        .then(res => console.log('下发方案邮件提醒发送情况：', res));
    }
    return ` ${checkDupString ? `，但${checkDupString}` : ''}`;
  };
  that.updateDispatchGroup = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_dispatch_group SET ? WHERE id= ? `,
        values: [config, id]
      });
      // 同步dispatch_config表的dp_concat字段
      let { dp_concat, id: cid } = (
        await mySqlConn.runQuery({
          sql: `SELECT c.id, c.dp_concat FROM ums_dispatch_group AS g
        LEFT JOIN ums_dispatch_config AS c ON g.dg_configid = c.id
        WHERE g.id= '${id}' `
        })
      ).result[0];
      if (dp_concat) {
        dp_concat = JSON.parse(dp_concat);
        const keyIndex = lodash.findIndex(
          dp_concat,
          (val) => val.key * 1 == id
        );
        if (keyIndex != -1) {
          dp_concat[keyIndex] = {
            ...dp_concat[keyIndex],
            label: config.dg_name
          };
        }
        await mySqlConn.runQuery({
          sql: `UPDATE ums_dispatch_config SET dp_concat = '${JSON.stringify(
            dp_concat
          )}' WHERE id= '${cid}' `
        });
      }
      return `update ums_dispatch_group, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_dispatch_group SET ? `,
        values: config
      });
      return `insert ums_dispatch_group, result: ${result}`;
    }
  };

  that.dispatchConfigAction = async (req) => {
    let { dp_state, id } = req.body;
    // let thisConfig = (await this.getDispatchConfigByID({params:{id:id}}))[0];
    // let dp_concat = JSON.parse(thisConfig.dp_concat).map(element => element.key);
    // let centerConfigs = (await mySqlConn.runQuery({
    //   sql: `SELECT id,config_value FROM ums_configuration
    //   WHERE id IN (${dp_concat.toString()})
    //   ORDER BY field(id,${dp_concat.toString()})`
    // })).result;
    // let mergedCenterConfig = {};
    // centerConfigs.forEach(element => {
    //   // 可能输入的JSON的key带引号，也可能不带。因此用这个函数来格式化它。
    //   let formatVal = eval('(' + element.config_value + ')');
    //   mergedCenterConfig = {...mergedCenterConfig,...formatVal};
    // });
    return await mySqlConn.runQuery({
      sql: `UPDATE ums_dispatch_config SET dp_state = ${dp_state == 1 ? 0 : 1
        } WHERE id= '${id}'`
    });
  };

  that.deleteSystemConfig = (id) => deleteConfigModel(id);
  that.deleteFeatureConfig = (id) => deleteConfigModel(id);
  that.deleteABTestConfig = (id) => deleteConfigModel(id);
  that.deleteCenterConfig = (id) => deleteConfigModel(id);
  that.deleteDispatchConfig = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE ums_dispatch_config SET dp_delete = 1 WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  that.deleteDispatchGroup = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE ums_dispatch_group SET dg_delete = 1 WHERE id= '${id}' `,
      values: [id]
    });
    // 同步dispatch_config表的dp_concat字段
    let { dp_concat, id: cid } = (
      await mySqlConn.runQuery({
        sql: `SELECT c.id, c.dp_concat FROM ums_dispatch_group AS g
      LEFT JOIN ums_dispatch_config AS c ON g.dg_configid = c.id
      WHERE g.id= '${id}' `
      })
    ).result[0];
    if (dp_concat) {
      dp_concat = JSON.parse(dp_concat);
      lodash.remove(dp_concat, (val) => val.key * 1 == id);
      await mySqlConn.runQuery({
        sql: `UPDATE ums_dispatch_config SET dp_concat = '${JSON.stringify(
          dp_concat
        )}' WHERE id= '${cid}' `
      });
    }
    return result;
  };

  return that;
};
