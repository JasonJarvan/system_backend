const { createToken, varifyRefresh } = require("../middleware/token");
const jwtExpTime = process.env.JWT_EXPTIME || 18000 * 1000;
const refreshSecret = process.env.JWT_REFRESH_SECRET || "test";
const jwtSecret = process.env.JWT_SECRET || "test";
const logger = require("../common/logger/logger");
const adminModel = require("./adminModel")();
const errorMsg = require("../common/errorMessage");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { getUserMenu, getUserAccess } = require("../middleware/RBAC");
const { getListController, getController, updateListController } = require("../common/controlHelper");
const salt = process.env.SALT || 10;
// bind ip with token for security
const refreshToken = (req, res) => {
  try {
    const oldToken = req.headers.authorization.substring(7);
    let info = varifyRefresh(oldToken);
    //let { id, username } = info;
    delete info["iat"];
    delete info["exp"];
    const token = createToken({ ...info }, jwtExpTime, jwtSecret);
    let status = 200;
    res.status(200).json({ status, token: token });
  } catch (err) {
    logger.insert("user", "error", err);
    res.status(401).json({ status: 401, errorMessage: "token is not valid" });
  }
};
const createNewAccount = async (req, res) => {
  const user = req.body;
  if (!createAccountChecker(user)) {
    return res
      .status(400)
      .json({ status: 400, errorMessage: errorMsg("USER_INFOMATION_MISSING") });
  }
  const password = bcrypt.hashSync(user.password, salt);

  try {
    await adminModel.insertUser({
      ...user,
      password
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("user", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const login = async (req, res) => {
  try {
    let { username, password, autoLogin } = req.body;
    res.set("Pragma", "no-cache");
    res.set("Cache-Control", "no-store");
    if (!username || !password) {
      return res
        .status(400)
        .json({ status: 400, errorMessage: errorMsg("SERVER_ERROR") });
    }
    let user = await adminModel.findByUserName(username);
    if (!user) {
      return res
        .status(404)
        .json({ status: 404, errorMessage: "User Not found" });
    }
    let userLoginFailLog = await adminModel.getLoginFail(user.id);
    if (
      userLoginFailLog?.ban_time &&
      userLoginFailLog?.ban_time > moment().unix()
    ) {
      return res.status(404).json({
        status: 404,
        errorMessage: `User is banned due to overmuch password retry, please wait until ${moment
          .unix(userLoginFailLog.ban_time)
          .format("YYYY-MM-DD HH:mm:ss")}`
      });
    }
    // check password correction
    if (!user.password || !bcrypt.compareSync(password, user.password)) {
      adminModel.setLoginFail(userLoginFailLog, user);
      return res.status(404).json({
        status: 404,
        errorMessage: `Password is not correct, Retry Times Left: ${userLoginFailLog?.fail_times <= 3
          ? 4 - userLoginFailLog.fail_times
          : userLoginFailLog?.fail_times == 4
            ? `0, please wait until ${moment()
              .add(15, "m")
              .format("YYYY-MM-DD HH:mm:ss")}`
            : "4"
          }`
      });
      // 如果fail_times = 0~3/null/5,则都说明没用过错误机会；如果为4，说明这一次就封了；如果为，说明还有机会
    }
    await adminModel.setLastLogin(username);
    let refTokenExpTime = autoLogin ? 18000 * 300 * 40 : 18000 * 300;

    //public information

    // generate token
    let token = createToken(
      {
        id: user.id,
        username,
        role: user.role
        //signature
      },
      jwtExpTime,
      jwtSecret
    );
    let refToken = createToken(
      {
        id: user.id,
        username,
        role: user.role
        //signature
      },
      refTokenExpTime,
      refreshSecret
    );
    let resUser = {};
    // remove null value
    for (let i in user) {
      if (user[i] && i != "password") {
        resUser[i] = user[i];
      }
    }
    logger.insert("user", "info", `user:${username} login`);
    return res.status(200).json({
      status: 200,
      data: { resUser, token, refToken }
    });
  } catch (err) {
    logger.insert("user", "error", err.toString());
    return res.status(500).json({ status: 500, errorMessage: err });
  }
};
const checkExist = async (req, res) => {
  const username = req.params.username;
  let user = await adminModel.findByUserName(username);
  if (user) {
    logger.insert("user", "trace", "User already exist");
    return res
      .status(400)
      .json({ status: 400, errorMessage: "User already exist" });
  }
  logger.insert("user", "trace", "User not exist");
  return res.status(200).json({ status: 200 });
};
const getUserList = async (req, res) =>
  getListController(req, res, adminModel.getUserList);
//  {
//   try {
//     let { limit, offset } = req.query;
//     //let current = limit && limit > 0 ? offset / limit : 1;
//     let current = limit && limit > 0 && offset > 0 ? offset / limit + 1 : 1;
//     let { list, total } = await adminModel.getUserList(offset, limit);
//     return res.status(200).json({
//       status: 200,
//       data: {
//         list,
//         current,
//         pageSize: limit || 20,
//         total
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ status: 500, errorMessage: error });
//   }
// };

const getUserInfo = async (req, res) => {
  try {
    let { username } = req.user;
    let userInfo = await adminModel.findByUserName(username);
    let data = {};
    for (let key in userInfo) {
      if (userInfo[key] && key != "password") data[key] = userInfo[key];
    }

    data.route = await getUserMenu(userInfo.role);
    data.access = await getUserAccess(userInfo.role);
    //res.setHeader("Cache-Control", "max-age=300");
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};
const updateUser = async (req, res) => {
  let username = req.params.username;
  const user = req.body;
  console.log(req.params, req.body);
  try {
    //ignore password
    delete user["password"];
    await adminModel.updateUserByUsername(username, {
      ...user
    });
    res.status(200).json({ code: 200, errorMessage: `update successful` });
  } catch (error) {
    res.status(500).json({ code: 500, errorMessage: error });
  }
  return;
};
const updateUserStatus = async (req, res) => {
  const config = req.body;
  let id = config.id;
  const status = config.status;

  try {
    let info = req.user;
    if (id == info.id) {
      return res
        .status(403)
        .json({ code: 403, errorMessage: `you can not forbid yourself!` });
    }
    await adminModel.updateUserStatusById(id, status);
    res.status(200).json({ code: 200, errorMessage: `update successful` });
    console.log(`Update user:${id}`);
  } catch (error) {
    console.error(`Error: update user:${id} `);
    res.status(500).json({ code: 500, errorMessage: error });
  }
  return;
};

const updateUserPswd = async (req, res) => {
  const config = req.body;
  let id = config.id;
  try {
    const password = bcrypt.hashSync(config.password, salt);
    await adminModel.updateUserPswdById(id, password);
    res.status(200).json({ code: 200, errorMessage: `update successful` });
    console.log(`Update userPswd:${id}`);
  } catch (error) {
    console.error(`Error: update userPswd:${id} ` + error.message);
    res.status(500).json({ code: 500, errorMessage: error });
  }
  return;
};

const tryUpdatePswdByID = async (req, res) => {
  const { id, username, oldpassword, newpassword } = req.body;
  // verify old password
  try {
    const userInfo = await adminModel.findByUserName(username);
    console.log(!userInfo.password || !bcrypt.compareSync(oldpassword, userInfo.password));
    if (!userInfo.password || !bcrypt.compareSync(oldpassword, userInfo.password)) {
      throw new Error("Old password is wrong");
    }
  } catch (error) {
    res.status(400).json({ code: 400, errorMessage: error.message });
    return;
  }
  // update password
  try {
    const newpasswordhash = bcrypt.hashSync(newpassword, salt);
    await adminModel.updateUserPswdById(id, newpasswordhash);
    res.status(200).json({ code: 200, errorMessage: `update successful` });
    console.log(`Update userPswd:${id}`);
  } catch (error) {
    console.error(`Error: update userPswd:${id} ` + error.message);
    res.status(500).json({ code: 500, errorMessage: error });
    return;
  }
  return;
};

const deleteUser = async (req, res) => {
  try {
    let id = req.params.id;
    // let id = req.id;
    if (!id)
      return res
        .status(500)
        .json({ status: 500, errorMessage: "missing argument" });
    let data = await adminModel.deleteUserById(id);
    if (data === 0) {
      return res
        .status(400)
        .json({ code: 400, errorMessage: "delete admin fail,adminId:" + id });
    }

    let roleAccount = await adminModel.getRoleListByAdminId(id);

    let dataRole = await adminModel.deleteUserRoleRelationByAdminId(id);
    if (roleAccount > 0 && dataRole === 0) {
      return res.status(400).json({
        code: 400,
        errorMessage: "delete admin role fail,adminId:" + id
      });
    }

    console.log(`User delete:user ${id} has been deleted successful`);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "successful delete account" });
    // return res
    //   .status(400)
    //   .json({ code: 400, errorMessage: "cannot delete superAdmin user" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, errorMessage: error });
  }
};

const createAccountChecker = (user) => {
  // todo:add other condition for register
  return user.username && user.password;
};
const getUserByID = (req, res) => getController(req, res, adminModel.getUserByID);
const updateUserByID = (req, res) => updateListController(req, res, { modelFunc: adminModel.updateUserByID });

module.exports = {
  updateUser,
  getUserInfo,
  getUserList,
  checkExist,
  login,
  createNewAccount,
  refreshToken,
  deleteUser,
  updateUserStatus,
  updateUserPswd,
  tryUpdatePswdByID,
  getUserByID,
  updateUserByID
};
