const express = require("express");
let router = express.Router();
const { validateToken, validateRefToken } = require("../middleware/token");
const {
  login,
  refreshToken,
  checkExist,
  getUserInfo,
  createNewAccount,
  getUserList,
  deleteUser,
  updateUser,
  updateUserStatus,
  updateUserPswd,
  tryUpdatePswdByID,
  getUserByID,
  updateUserByID
} = require("./controller");
router.post("/login", login);
//router.get("/refToken", validateRefToken, refreshToken);
router.get("/validate/:username", checkExist);
router.post("/register", createNewAccount);
//router.use(validateToken);
router.get("/currentUser", getUserInfo);
//router.get("/personalInfo", getUserInfo);
router.post("/", createNewAccount);
router.get("/", getUserList);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);
router.post("/userStatus", updateUserStatus);
router.post("/userPswd", updateUserPswd);
router.post("/tryUpdatePswdByID", tryUpdatePswdByID);
//todo: update user information
// router.put('/:username',controller.updateItem)
//todo: delete user
// router.delete('/:username',controller.deleteItem)
// roles & permissions
router.get("/user/:id", getUserByID);
router.post("/user", updateUserByID);
module.exports = router;
