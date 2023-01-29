const logger = require("../common/logger/logger");
const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  getMediaServer,
  getLogQuery,
  getLogQueryRegion,
  getLogQueryLogset,
  getLogQueryTopic,
  getAPMLogNums,
  getfuncName,
  getAPMLogs,
  getMsgStatus,
  getOperationLog,
  getSettingRequest,
  getTobmsgbus,
  getAndCtrlDelLog,
  getInstallInfo,
  getControlInfo,
  getOnlineInfo,
  getUserInfo,
  getMsgMonitor,
  getMsgStatistics
} = require("./controller");
router.use(validateToken);

router.get("/media", getMediaServer);
router.get("/logQuery", getLogQuery);
router.get("/logQueryRegion", getLogQueryRegion);
router.get("/logQueryLogset", getLogQueryLogset);
router.get("/logQueryTopic", getLogQueryTopic);
router.get("/apm/logNums", getAPMLogNums);
router.get("/apm/funcName", getfuncName);
router.get("/apm/logsByDateVer", getAPMLogs);
router.get("/sms/query", getMsgStatus);
router.get("/operation/query", getOperationLog);
router.get("/settingRequest/query", getSettingRequest);
router.get("/tobmsgbus/query", getTobmsgbus);
router.get("/deletelog/android/controlled", getAndCtrlDelLog);
router.get("/installInfo", getInstallInfo);
router.get("/controlInfo", getControlInfo);
router.get("/onlineInfo", getOnlineInfo);
router.get("/userInfo", getUserInfo);
router.get("/msgMonitor", getMsgMonitor);
router.get("/msgStatistics", getMsgStatistics);

module.exports = router;
