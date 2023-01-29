const logger = require("../common/logger/logger");
const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  dashboard,
  getCount,
  getNewCount,
  getWeekTdCount,
  getOrderAnalysis,
  getProductOrderAnalysis,
  getGMV,
  getEnterpriseAnalysis,
  getOverseaAnalysis,
  getEnterpriseCount,
  getUserRenewal,
  getUserPaid,
} = require("./controller");

router.use(validateToken);
router.get("/", dashboard);
router.get("/getCount", getCount);
router.get("/getNewCount", getNewCount);
router.get("/getWeekTdCount", getWeekTdCount);
router.get("/orderAnalysis", getOrderAnalysis);
router.get("/productOrder", getProductOrderAnalysis);
router.get("/GMV", getGMV);
router.get("/enterpriseAnalysis", getEnterpriseAnalysis);
router.get("/overseaAnalysis", getOverseaAnalysis);
router.get("/enterpriseCount", getEnterpriseCount);
router.get("/userRenewal", getUserRenewal);
router.get("/userPaid", getUserPaid);

module.exports = router;
