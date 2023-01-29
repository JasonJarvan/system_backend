const mysql = require("../../common/mysql");
const TABLENAME_PERMISSION = "ums_permission";
const TABLENAME_RESOURCE = "ums_resource";
const TABLENAME_ROLE_PERMISSION = "ums_role_permission_relation";
const TABLENAME_ROLE_RESOURCE = "ums_role_resource_relation";
function role() {
  const mySqlConn = mysql({ dbname: "admin" });
  const resultReducer = (result) => {
    const response = [];
    let tempid = -1;
    let lastInd = -1;
    result.forEach((element) => {
      if (element.mainid != tempid) {
        const {
          mainpath: path,
          mainname: name,
          mainicon: icon,
          main1value: value,
          main2id
        } = element;
        if (main2id) {
          tempid = element.mainid;
          response.push({
            path,
            name,
            icon,
            children: []
          });
          lastInd += 1;
        }
      }
      const {
        main2path: path,
        main2name: name,
        main2icon: icon,
        main2id: id,
        permission_id,
        main2value: value
      } = element;
      if (permission_id != null) {
        response[lastInd].children.push({
          path,
          name,
          icon,
          id
        });
      }
    });
    return response;
  };

  const getMenus = async (roles) => {
    if (roles.length < 0) {
      return [];
    }
    // 获取所有一级菜单
    const { result: main } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_permission WHERE type = 0`
    });

    // 获取所有有权限的菜单
    const { result: menus } = await mySqlConn.runQuery({
      sql: ` SELECT p1.* FROM ums_permission p1,
      (SELECT p.* FROM ums_permission p,ums_role_permission_relation rpr 
       WHERE p.id = rpr.permission_id AND rpr.role_id IN (?)) p2
      WHERE (p1.id=p2.pid OR p1.id=p2.id) AND p1.type>0 GROUP BY id ORDER BY p1.pid,p1.sort,p1.id`,
      values: [roles]
    });
    const response = [];
    const sort = (a, b) => a.sort - b.sort;
    // 处理菜单，目前只支持三级菜单（一级为顶部菜单）
    for (const menu of menus) {
      let mainMenu = response.find((item) => item.id === menu.pid);
      const children = menus
        .filter((item) => item.pid === menu.id)
        .map((item) => ({
          path: item.path,
          name: item.name,
          icon: item.icon,
          id: item.id,
          sort: item.sort
        }))
        .sort(sort);
      if (mainMenu) {
        mainMenu.children.push({
          path: menu.path,
          name: menu.name,
          icon: menu.icon,
          id: menu.id,
          sort: menu.sort,
          children
        });
        mainMenu.children.sort(sort);
      } else {
        mainMenu = main.find((item) => item.id === menu.pid);
        if (!mainMenu) continue;
        response.push({
          path: mainMenu.path,
          name: mainMenu.name,
          icon: mainMenu.icon,
          id: mainMenu.id,
          sort: mainMenu.sort,
          children: [
            {
              path: menu.path,
              name: menu.name,
              icon: menu.icon,
              id: menu.id,
              sort: menu.sort,
              children
            }
          ]
        });
      }
    }
    response.sort(sort);
    return response;
  };

  const getValidResource = async (roles, method) => {
    if (!roles || roles.length == 0) return [];
    let roleString = roles.join(",");
    const tempTable = `SELECT resource_id FROM ${TABLENAME_ROLE_RESOURCE} WHERE role_id IN (${roleString})`;
    let sql = `SELECT * FROM ${TABLENAME_RESOURCE} t1 RIGHT JOIN (${tempTable}) t2 ON t1.id=t2.resource_id WHERE method=?`;
    let { result } = await mySqlConn.runQuery({
      sql,
      values: [method]
    });
    return result;
  };
  const getAllValidResource = async (roles) => {
    if (!roles || roles.length == 0) return [];
    let roleString = roles.join(",");
    const tempTable = `SELECT permission_id FROM ${TABLENAME_ROLE_PERMISSION} WHERE role_id IN (${roleString})`;
    let sql = `SELECT * FROM ${TABLENAME_PERMISSION} t1 RIGHT JOIN (${tempTable}) t2 ON t1.id=t2.permission_id  WHERE t1.type>0`;
    let { result } = await mySqlConn.runQuery({
      sql
    });
    return result;
  };
  return {
    getMenus,
    getValidResource,
    getAllValidResource
  };
}

module.exports = role;
