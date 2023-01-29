const express = require("express");
let router = express.Router();
const {
  getCompanyList,
  getCompanyListV2,
  getCompanyListCount,
  getCompanyByID,
  getCompanyInfoByID,
  getCompanyUserList,
  getCompanyUserByID,
  updateCompanyUserLock,
  updateCompanyUser,
  getCompanyPermission,
  getCompanyPermissionValue,
  getCompanyUserPermission,
  updateCompanyPermission,
  updateCompanyUserPermission,
  deleteCompanyPermission,
  updateCompany,
  updateCompanyStatus,
  getCompanyDeviceList,
  searchCompanyName,
  getGpuList,
  getGpuWhitelist,
  deleteGpuWhitelist,
  updateGpuWhitelist,
  getGhostBlackList,
  deleteGhostBlackList,
  addGhostBlackList,
  getCompanyVersion,
  updateCompanyVersion,
  deleteCompanyVersion,
  getCompanyVersionValue,
  getCompanyConnectionLog,
  getCompanyConnectionLogCount,
  getCompanyLoginLog,
  getCompanyOrder,
  getCompanyOrderCount,
  getCompanyListSimple,
  getCompanyOrderByID,
  getCompanyOrdersByCompanyID,
  updateCompanyOrder,
  changeCompanyOrderStatus,
  importCompanyOrder,
  getMD5List,
  getMD5ByID,
  deleteMD5,
  updateMD5,
} = require("./controller");

router.get("/company", getCompanyList);
router.get("/companyV2", getCompanyListV2);
router.get("/companyV2/count", getCompanyListCount);
router.get("/company/status/:id", getCompanyByID);
router.get("/company/info/:id", getCompanyInfoByID);
router.get("/company/permission", getCompanyPermission);
router.post("/company/permission", updateCompanyPermission);
router.delete("/company/permission/:id", deleteCompanyPermission);
router.get("/company/permission/value", getCompanyPermissionValue);

router.get("/company/version", getCompanyVersion);
router.post("/company/version", updateCompanyVersion);
router.delete("/company/version/:id", deleteCompanyVersion);
router.get("/company/version/value", getCompanyVersionValue);

router.post("/company/detail", updateCompany);
router.post("/company/status", updateCompanyStatus);

router.get("/company/user", getCompanyUserList);
router.get("/company/user/info/:id", getCompanyUserByID);
router.put("/company/user/lock", updateCompanyUserLock);
router.post("/company/user", updateCompanyUser);
router.get("/company/user/permission", getCompanyUserPermission);
router.post("/company/user/permission", updateCompanyUserPermission);

router.get("/company/device", getCompanyDeviceList);
router.get("/company/name", searchCompanyName);

router.get("/company/log/connection", getCompanyConnectionLog);
router.get("/company/log/connection/count", getCompanyConnectionLogCount);
router.get("/company/log/login", getCompanyLoginLog);

router.get("/gpu", getGpuList);
router.get("/gpu/whitelist", getGpuWhitelist);
router.delete("/gpu/whitelist/:id", deleteGpuWhitelist);
router.post("/gpu/whitelist", updateGpuWhitelist);

router.get("/ghostBlackList", getGhostBlackList);
router.delete("/ghostBlackList", deleteGhostBlackList);
router.post("/ghostBlackList", addGhostBlackList);

router.get("/company/order", getCompanyOrder);
router.get("/company/order/count", getCompanyOrderCount);
router.get("/company/simple", getCompanyListSimple);
router.get("/company/order/order/:id", getCompanyOrderByID);
router.get("/company/order/company/:id", getCompanyOrdersByCompanyID);
router.post("/company/order", updateCompanyOrder);
router.post("/company/order/status", changeCompanyOrderStatus);
router.post("/company/order/import", importCompanyOrder);

router.get("/md5", getMD5List);
router.get("/md5/:id", getMD5ByID);
router.delete("/md5/:id", deleteMD5);
router.post("/md5", updateMD5);

module.exports = router;
