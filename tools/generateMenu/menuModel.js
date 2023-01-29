const mysql = require("../mysql");
const TABLENAME_PERMISSION = "ums_permission";
function role() {
  let mySqlConn = mysql();
  const getMenus = async () => {
    const sql2 = `SELECT pid,id,path,name,icon,value from ${TABLENAME_PERMISSION} where type=1`;
    const sql3 = `SELECT pid,id,path,name,icon,value from ${TABLENAME_PERMISSION} where type=0`;
    let sql = `SELECT main.id as mainid,main.path as mainpath,main.name as mainname,main.icon as mainicon,main.value as main1value,main2.id as main2id,main2.path as main2path,main2.name as main2name,main2.value as main2value,main2.icon as main2icon FROM  (${sql3}) main LEFT JOIN (${sql2}) main2 ON main.id=main2.pid ORDER BY mainid`;
    let { result } = await mySqlConn.runQuery({
      sql
    });
    //console.log(result)
    let response = resultMenusReducer(result);
    return response;
  };

  const resultMenusReducer = (result) => {
    let response = [];
    let tempid = -1;
    let lastInd = -1;
    result.forEach((element) => {
      if (element.mainid != tempid) {
        let {
          mainpath: path,
          mainname: name,
          mainicon: icon,
          main1value: value,
          main2id,
          main2path
        } = element;
        tempid = element.mainid;
        response.push({
          path,
          name,
          icon,
          routes: [
            {
              path,
              redirect: main2path
            }
          ]
        });
        lastInd += 1;
      }
      let {
        main2path: path,
        main2name: name,
        main2icon: icon,
        main2id: id,
        main2value: value
      } = element;
      response[lastInd].routes.push({
        path,
        name,
        icon,
        component: `.${path}`,
        access: "canAccess"
      });
    });
    return response;
  };
  return {
    getMenus
  };
}
module.exports = role;
