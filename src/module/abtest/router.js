const logger = require("../common/logger/logger");
const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  getAbtests,
  getAbtestNames,
  getVersion,
  updateVersion,
  deleteVersion,
  getVersionGray,
  updateVersionGray,
  deleteVersionGray
} = require("./controller");
router.use(validateToken);
router.get("/data", getAbtests);
router.get("/datanames", getAbtestNames);

router.get("/version", getVersion);
router.post("/version", updateVersion);
router.get("/version/:versionId", getVersion);
router.delete("/version/:versionId", deleteVersion);

router.get("/version/gray/:versionId", getVersionGray);
router.post("/version/gray", updateVersionGray);
router.delete("/version/gray/:grayId", deleteVersionGray);

module.exports = router;
