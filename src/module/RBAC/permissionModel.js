const mysql = require("../common/mysql");
const TABLENAME_PERMISSION = "ums_permission";
const TABLENAME_ROLE_PERMISSION = "ums_role_permission_relation";
function role() {
  let mySqlConn = mysql({ dbname: "admin" });

  const resultReducer = (result) => {
    let response = [];
    let tempid = -1;
    let lastInd = -1;
    result.forEach((element) => {
      if (element.mainid != tempid) {
        tempid = element.mainid;
        let {
          mainpath: path,
          mainname: name,
          mainicon: icon,
          main1value: value
        } = element;
        response.push({
          path,
          name,
          icon,
          value,
          routes: []
        });
        lastInd += 1;
      }
      let {
        main2path: path,
        main2name: name,
        main2icon: icon,
        main2id: id,
        permission_id,
        main2value: value
      } = element;
      response[lastInd].routes.push({
        path,
        name,
        icon,
        id,
        value,
        isPermit: permission_id != null
      });
    });
    return response;
  };
  const getMenuByRoleId = async (id) => {
    // 获取所有菜单
    const { result: menusResult } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_permission`
    });

    // 处理菜单，目前只支持三级菜单（一级为顶部菜单）
    const menus = [];

    for (const menu of menusResult) {
      if (menu.type === 0) {
        menus.push({
          title: menu.value,
          key: menu.id,
          children: []
        });
      } else {
        const parent = menus.find((item) => item.key === menu.pid);
        if (parent) {
          parent.children.push({
            title: menu.value,
            key: menu.id,
            children: menusResult
              .filter((item) => item.pid === menu.id)
              .map((item) => ({
                title: item.value,
                key: item.id
              }))
          });
        }
      }
    }

    // 获取所有有权限的菜单
    const { result: permissions } = await mySqlConn.runQuery({
      sql: `SELECT DISTINCT(permission_id) FROM ums_role_permission_relation WHERE role_id=? AND permission_id IN (SELECT id FROM ums_permission)`,
      values: [id]
    });
    return { menus, permissions: permissions.map((p) => p.permission_id) };
  };
  return {
    getMenuByRoleId
  };
}
module.exports = role;
