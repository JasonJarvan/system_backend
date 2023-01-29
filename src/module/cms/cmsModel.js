const mysql = require("../common/mysql");
const { escape: mysqlEscape } = require("mysql");
const mySqlConn = mysql({ multipleStatements: true, dbname: "admin" });
const centerSqlConn = mysql({ multipleStatements: true, dbname: "center" });
const moment = require("moment");
const lodash = require("lodash");
const TABLENAME_ARTICLE = "ums_cms_article";
const TABLENAME_LINKS = "ums_cms_links";
const TABLENAME_ADMIN = "ums_admin";
const {
  getListBySQL,
  SQLpostfixGenerator,
  whereStrGenerator,
  converDataListToObject,
  whenThenGenerator,
  inGenerator
} = require("../common/modelHelper.js");

/**
 * 同步文章和资讯类型之间的关联
 * @param {*} articleid 文章ID
 * @param {*} typeArray 资讯类型关联数组,e.g. 
 * [
    { label: 'ToDesk技术前沿', value: '2', key: '2' },
    { label: '安全与合规实践', value: '3', key: '3' }
  ]
 * @param {*} isUpdate 是否是更新文章（否是插入新文章）
 */
const syncArticleType = async (articleid, typeArray, isUpdate) => {
  // 删除所有该文章的关联项
  await mySqlConn.runQuery({
    sql: `DELETE FROM ums_tag_relation WHERE rid = ${articleid}`
  });
  // 根据typeArray同步文章和资讯类型之间的关联
  if (typeArray) {
    let groupRank = JSON.parse(typeArray);
    // 不能直接用groupRank.foreach，因为forEach本身是异步操作。要用for await。
    for await (element of groupRank) {
      await mySqlConn.runQuery({
        sql: `INSERT IGNORE INTO ums_tag_relation
        SET rid = ${articleid}, tag_id = ${element.value}`
      })
    }
  }
};

module.exports = function cms() {

  // let that = this;
  const updateCmsArticle = async (info) => {
    let { newsType, ...config } = info;

    const keys = [],
      values = [];
    [
      "article_title",
      "sub_title",
      "info_sources",
      "info_introduction",
      "info_content",
      "browse_count",
      "release_time",
      "release_admin",
      "is_release",
      "tags",
      "article_image",
      "release_type",
      "is_hot"
    ].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        keys.push(key + "=?");
        values.push(config[key]);
      }
    });
    let result;
    if (config.id) {
      values.push(config.id);
      result = await mySqlConn.runQuery({
        sql: `UPDATE ${TABLENAME_ARTICLE} SET ${keys.toString()} WHERE id=? `,
        values
      });
      syncArticleType(config.id, newsType, true);
    } else {
      result = await mySqlConn.runQuery({
        sql: `INSERT INTO ${TABLENAME_ARTICLE} SET ${keys.toString()}`,
        values
      });
      id = result.result.insertId;
      syncArticleType(id, newsType);
    }
    return `Update ums_cms_article, result: ${JSON.stringify(result)}`;
  };

  // const updateCmsArticle = async (config) => {
  //   // let config = { ...req.body };
  //   let id = config.id;
  //   delete config["id"];
  //   if (id) {
  //     let result = await mySqlConn.runQuery({
  //       sql: `UPDATE ums_cms_article SET ? WHERE id= ? `,
  //       values: [config, id]
  //     });
  //     return `update ums_cms_article, result: ${result}`;
  //   } else {
  //     let result = await mySqlConn.runQuery({
  //       sql: `INSERT INTO ums_cms_article SET ? `,
  //       values: config
  //     });
  //     return `insert ums_cms_article, result: ${result}`;
  //   }
  // };

  const getArticleById = async (id, type = 2) => {
    const article = (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ${TABLENAME_ARTICLE} WHERE id=? ${type == 2 ? "" : `AND release_type IN (${mysqlEscape(type)},2)`
          }`,
        values: [id]
      })
    ).result[0];
    if (!article) return;
    const releaseType =
      article.release_type == 2
        ? ""
        : `AND release_type IN (${mysqlEscape(article.release_type)},2)`;
    const next = (
      await mySqlConn.runQuery({
        sql: `SELECT id,article_title FROM ${TABLENAME_ARTICLE} WHERE id>? AND is_release=? ${releaseType} LIMIT 1`,
        values: [id, article.is_release]
      })
    ).result[0];
    const prev = (
      await mySqlConn.runQuery({
        sql: `SELECT id,article_title FROM ${TABLENAME_ARTICLE} WHERE id<? AND is_release=? ${releaseType} LIMIT 1`,
        values: [id, article.is_release]
      })
    ).result[0];
    article.next = next;
    article.prev = prev;
    return article;
  };

  const getArticleList = async (offset = 0, limit = 20, type = 2, tag) => {
    let whereSql = "";
    if (type != 2) {
      whereSql += `WHERE a.release_type IN (${mysqlEscape(type)},2) `;
    }
    if (tag) {
      whereSql += whereSql ? "AND" : "WHERE";
      whereSql += ` FIND_IN_SET(${mysqlEscape(
        decodeURI(decodeURI(tag))
      )},a.tags)`;
    }
    const list = (
      await mySqlConn.runQuery({
        sql: `SELECT a.id,a.article_title,a.sub_title,a.info_sources,a.info_introduction,a.browse_count,a.create_time,
        a.release_time,a.release_admin,a.is_release,a.tags,a.article_image,a.release_type,b.username as release_admin_name 
        FROM ${TABLENAME_ARTICLE} a 
        LEFT JOIN ${TABLENAME_ADMIN} b ON a.release_admin = b.id ${whereSql} ORDER BY a.id DESC LIMIT ?,?`,
        values: [Number(offset), Number(limit)]
      })
    ).result;
    const { total } = (
      await mySqlConn.runQuery({
        sql: `SELECT COUNT(a.id) AS total FROM ${TABLENAME_ARTICLE} a ${whereSql}`
      })
    ).result[0];

    return { list, total };
  };
  const deleteArticleById = async (id) => {
    return await mySqlConn.runQuery({
      sql: `DELETE FROM ${TABLENAME_ARTICLE} WHERE id = ?`,
      values: [id]
    });
  };
  const getArticleNewsType = async (req) => {
    let whereStr = `WHERE 1 = 1`;
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT a.id, a.tag_name, group_concat(r.rid) AS articleids 
    FROM ums_tag AS a
    LEFT JOIN ums_tag_relation AS r ON a.id = r.tag_id 
    ${SQLpostfixGenerator(`${whereStr} GROUP BY a.id`, req.query)}`;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_tag
    ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const getNewsTypeByArticle = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT a.id, a.tag_name
        FROM ums_tag AS a
        LEFT JOIN ums_tag_relation AS r ON a.id = r.tag_id 
      WHERE r.rid = '${req.params.id}'`
      })
    ).result;
  };

  const cmsArticleViewed = async (id) => {
    return await mySqlConn.runQuery({
      sql: `UPDATE ${TABLENAME_ARTICLE} SET browse_count=browse_count+1 WHERE id=? `,
      values: [id]
    });
  };
  const getLinksList = async (type = 0) => {
    return await mySqlConn.runQuery({
      sql: `SELECT * FROM ${TABLENAME_LINKS} WHERE release_type=? ORDER BY sort `,
      values: [type]
    });
  };

  const updateLinksList = async (linksList) => {
    let sql = "";
    linksList.forEach((link) => {
      if (link.id) {
        sql += `UPDATE ${TABLENAME_LINKS} SET name=${mysqlEscape(
          link.name
        )},url=${mysqlEscape(link.url)},sort=${mysqlEscape(
          link.sort
        )} WHERE id=${mysqlEscape(link.id)};`;
      } else {
        sql += `INSERT INTO ${TABLENAME_LINKS} SET name=${mysqlEscape(
          link.name
        )},url=${mysqlEscape(link.url)},sort=${mysqlEscape(
          link.sort
        )},release_type=${mysqlEscape(link.release_type)};`;
      }
    });
    if (!sql) return;
    return await mySqlConn.runQuery({ sql });
  };

  const deleteLink = async (id) => {
    return await mySqlConn.runQuery({
      sql: `DELETE FROM ${TABLENAME_LINKS} WHERE id = ?`,
      values: [id]
    });
  };

  const getPictureList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM ums_cms_picture ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_cms_picture ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const getPictureByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_cms_picture WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  const updatePicture = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_cms_picture SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_cms_picture, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_cms_picture SET ? `,
        values: config
      });
      return `insert ums_cms_picture, result: ${result}`;
    }
  };
  const deletePicture = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_cms_picture WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };

  const getVideoList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT *
    FROM ums_cms_video ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_cms_video ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const getVideoByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT * FROM ums_cms_video WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  const deleteVideo = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_cms_video WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };
  const updateVideo = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_cms_video SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_cms_video, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_cms_video SET ? `,
        values: config
      });
      return `insert ums_cms_video, result: ${result}`;
    }
  };


  const getDocKeyWordList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM ums_docs_keywords ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_docs_keywords ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const updateDocKeyWord = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_docs_keywords SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_docs_keywords, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_docs_keywords SET ? `,
        values: config
      });
      return `insert ums_docs_keywords, result: ${result}`;
    }
  };
  const deleteDocKeyWord = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_docs_keywords WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };

  const getHelpDocList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT d.*,group_concat(dk.title) AS keywords 
      FROM todesk_admin.ums_docs d 
      LEFT JOIN todesk_admin.ums_docs_keywords dk 
      ON find_in_set(dk.id,d.keyword_ids)
      ${SQLpostfixGenerator(`${whereStr} GROUP BY d.id`, req.query, {
      order: "d.order"
    })}`;
    let getCountSql = `SELECT COUNT(d.id) AS total
      FROM todesk_admin.ums_docs d 
      LEFT JOIN todesk_admin.ums_docs_keywords dk 
      ON find_in_set(dk.id,d.keyword_ids) 
      ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const getHelpDocByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT d.*,group_concat(dk.title) AS keywords 
        FROM todesk_admin.ums_docs d 
        LEFT JOIN todesk_admin.ums_docs_keywords dk 
        ON find_in_set(dk.id,d.keyword_ids) 
        WHERE id = '${req.params.id} GROUP BY d.id'`
      })
    ).result;
  };
  const updateHelpDoc = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_docs SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_docs, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_docs SET ? `,
        values: config
      });
      return `insert ums_docs, result: ${result}`;
    }
  };
  const deleteHelpDoc = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE ums_docs SET is_delete = 1 WHERE id= '${id}';
        UPDATE ums_docs SET pid = -1 WHERE pid= '${id}';`,
      values: [id]
    });
    return result;
  };
  // getHelpDocList({
  //   query: {
  //     offset: 0,
  //     limit: 20,
  //     options: `{"sorter":{},"searchKeys":[],"filter":{"type":0,"pid":{"isnull":null},"is_delete":0}}`
  //   }
  // })
  const getFAQKeyWordList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM ums_faq_keywords ${SQLpostfixGenerator(whereStr, req.query)} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_faq_keywords ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const updateFAQKeyWord = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_faq_keywords SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_faq_keywords, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_faq_keywords SET ? `,
        values: config
      });
      return `insert ums_faq_keywords, result: ${result}`;
    }
  };
  const deleteFAQKeyWord = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `DELETE FROM ums_faq_keywords WHERE id= '${id}' `,
      values: [id]
    });
    return result;
  };

  const getFAQDocList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT d.*, group_concat(dk.title) AS keywords,
      t.id AS tag_id, t.tag_name
      FROM todesk_admin.ums_faq_docs d 
      LEFT JOIN todesk_admin.ums_faq_keywords dk 
      ON find_in_set(dk.id,d.keyword_ids)
      LEFT JOIN todesk_admin.ums_tag t
      ON d.category = t.id
      ${SQLpostfixGenerator(`${whereStr} GROUP BY d.id`, req.query, {
      order: "d.order"
    })}`;
    let getCountSql = `SELECT COUNT(d.id) AS total
      FROM todesk_admin.ums_faq_docs d 
      LEFT JOIN todesk_admin.ums_faq_keywords dk 
      ON find_in_set(dk.id,d.keyword_ids) 
      LEFT JOIN todesk_admin.ums_tag t
      ON d.category = t.id
      ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };
  const getFAQDocByID = async (req) => {
    return (
      await mySqlConn.runQuery({
        sql: `SELECT d.*, group_concat(dk.title) AS keywords, t.id AS tag_id, t.tag_name
        FROM todesk_admin.ums_faq_docs d 
        LEFT JOIN todesk_admin.ums_faq_keywords dk 
        ON find_in_set(dk.id,d.keyword_ids) 
        LEFT JOIN todesk_admin.ums_tag t
        ON d.category = t.id
        WHERE id = '${req.params.id}'`
      })
    ).result;
  };
  const updateFAQDoc = async (req) => {
    let config = { ...req.body };
    let id = config.id;
    delete config["id"];
    if (id) {
      let result = await mySqlConn.runQuery({
        sql: `UPDATE ums_faq_docs SET ? WHERE id= ? `,
        values: [config, id]
      });
      return `update ums_faq_docs, result: ${result}`;
    } else {
      let result = await mySqlConn.runQuery({
        sql: `INSERT INTO ums_faq_docs SET ? `,
        values: config
      });
      return `insert ums_faq_docs, result: ${result}`;
    }
  };
  const deleteFAQDoc = async (id) => {
    const { result } = await mySqlConn.runQuery({
      sql: `UPDATE ums_faq_docs SET is_delete = 1 WHERE id= '${id}';
        UPDATE ums_faq_docs SET pid = -1 WHERE pid= '${id}';`,
      values: [id]
    });
    return result;
  };
  const getFAQTags = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query);
    let sql = `SELECT * FROM ums_tag ${SQLpostfixGenerator(
      whereStr,
      req.query
    )} `;
    let getCountSql = `SELECT COUNT(id) AS total FROM ums_tag ${whereStr}`;
    return getListBySQL(sql, getCountSql, mySqlConn);
  };

  const getWorkOrderList = async (req) => {
    let whereStr = "WHERE 1=1";
    whereStr = whereStrGenerator(whereStr, req.query, { id: "w.id" });
    let sql = `SELECT w.*
      FROM center.tv_work_order w
      ${SQLpostfixGenerator(whereStr, req.query, { id: "w.id" })}`;
    let getCountSql = `SELECT COUNT(w.id)
    FROM center.tv_work_order w
      ${whereStr}`;
    return getListBySQL(sql, getCountSql, centerSqlConn);
  };
  const getWorkOrderByID = async (req) => {
    const orderResult = (
      await centerSqlConn.runQuery({
        sql: `SELECT w.*, u.phone, u.email, u.nickname
        FROM center.tv_work_order w
        LEFT JOIN center.tv_user u ON w.userid = u.id
        WHERE w.id = '${req.params.id}'`
      })
    ).result;
    let chatResult = (
      await centerSqlConn.runQuery({
        sql: `SELECT * FROM center.tv_work_order_chat
        WHERE order_id = '${req.params.id}' ORDER BY create_time`
      })
    ).result;
    chatResult = await addReplyerNameToChatResult(chatResult);
    return { orderResult, chatResult }
  };
  // 为chatResult添加replyer_name
  const addReplyerNameToChatResult = async (chatResult) => {
    // 同replyer和replyer_id去重
    let replyerList = chatResult.map((item) => {
      return { replyer: item.replyer, replyer_id: item.replyer_id };
    })
    let replyerSet = lodash.uniqWith(replyerList, lodash.isEqual);
    // 查询replyer和replyer_id对应的name并生成Map
    for (let i in replyerSet) {
      let { replyer, replyer_id } = replyerSet[i];
      if (replyer == 1) {
        let result = (
          await centerSqlConn.runQuery({
            sql: `SELECT nickname FROM center.tv_user WHERE id = '${replyer_id}'`
          })
        ).result[0];
        replyerSet[i].name = result.nickname;
      } else if (replyer == 2) {
        let result = (
          await mySqlConn.runQuery({
            sql: `SELECT username FROM todesk_admin.ums_admin WHERE id = '${replyer_id}'`
          })
        ).result[0];
        replyerSet[i].name = result?.username || "未知";
      }
    }
    let replyerMap = {};
    replyerSet.forEach((item) => {
      replyerMap[item.replyer] = { [item.replyer_id]: item.name, ...replyerMap[item.replyer] }
    });
    for (let i in chatResult) {
      chatResult[i].replyer_name = replyerMap[chatResult[i].replyer][chatResult[i].replyer_id];
    }
    return chatResult;
  };
  const updateWorkOrderChat = async (req) => {
    let config = { ...req.body };
    config.replyer = 2;
    config.replyer_id = req.user.id;
    let orderResult = await centerSqlConn.runQuery({
      sql: `UPDATE tv_work_order 
      SET status = IF(status = 1, 2, status), update_time = NOW()
      WHERE id= ? `,
      values: config.order_id
    });
    let chatResult = await centerSqlConn.runQuery({
      sql: `INSERT INTO tv_work_order_chat SET ?`,
      values: config
    });
    return `updateWorkOrderChat success`;
  };
  return {
    updateCmsArticle,
    getArticleById,
    getArticleList,
    deleteArticleById,
    cmsArticleViewed,
    getLinksList,
    updateLinksList,
    deleteLink,
    getPictureList,
    getPictureByID,
    updatePicture,
    deletePicture,
    getArticleNewsType,
    getNewsTypeByArticle,
    getVideoList,
    getVideoByID,
    deleteVideo,
    updateVideo,
    getDocKeyWordList,
    updateDocKeyWord,
    deleteDocKeyWord,
    getHelpDocList,
    getHelpDocByID,
    updateHelpDoc,
    deleteHelpDoc,
    getFAQKeyWordList,
    updateFAQKeyWord,
    deleteFAQKeyWord,
    getFAQDocList,
    getFAQDocByID,
    updateFAQDoc,
    deleteFAQDoc,
    getFAQTags,
    getWorkOrderList,
    getWorkOrderByID,
    updateWorkOrderChat,
  };
};
