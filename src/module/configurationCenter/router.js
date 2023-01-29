const express = require("express");
let router = express.Router();
const { body, validationResult } = require("express-validator");
const { validateToken, validateRefToken } = require("../middleware/token");
const {
  getSystemConfig,
  getFeatureConfig,
  getABTestConfig,
  getVersionConfig,
  getCenterConfig,
  getCenterConfigByID,
  getCenterConfigTemp,
  updateSystemConfig,
  updateFeatureConfig,
  updateABTestConfig,
  updateCenterConfig,
  updateVersionConfig,
  deleteSystemConfig,
  deleteFeatureConfig,
  deleteABTestConfig,
  deleteCenterConfig,
  getDispatchConfig,
  getDispatchConfigByID,
  updateDispatchConfig,
  dispatchConfigAction,
  deleteDispatchConfig,
  getDispatchGroup,
  getDispatchGroupByID,
  updateDispatchGroup,
  deleteDispatchGroup,
  getDispatchConfigAdmin,
  getAdminByDispatchConfig
} = require("./controller");

router.get("/SystemConfig", getSystemConfig);
router.get("/FeatureConfig", getFeatureConfig);
router.get("/ABTestConfig", getABTestConfig);
router.get("/VersionConfig", getVersionConfig);
router.get("/CenterConfig", getCenterConfig);
router.get("/CenterConfig/:id", getCenterConfigByID);
router.get("/CenterConfigTemp", getCenterConfigTemp);
router.get("/DispatchConfig", getDispatchConfig);
router.get("/DispatchConfig/:id", getDispatchConfigByID);
router.get("/DispatchGroup", getDispatchGroup);
router.get("/DispatchGroup/:id", getDispatchGroupByID);
router.get("/DispatchConfigAdmin", getDispatchConfigAdmin);
router.get("/adminByDispatchConfig/:id", getAdminByDispatchConfig);

router.post("/SystemConfig", updateSystemConfig);
router.post("/FeatureConfig", updateFeatureConfig);
router.post("/ABTestConfig", [
  body("config_ratio").isInt().custom((val) => val >= 0 && val <= 100),
  body("config_version").isString().custom((val) => /^(\d+[.])*(\d+)$/.test(val)),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error(errors);
    return res.status(400).json({ errors: errors.array() });
  }
  updateABTestConfig(req, res);
});
router.post("/VersionConfig", updateVersionConfig);
router.post("/CenterConfig", updateCenterConfig);
router.post("/DispatchConfig", updateDispatchConfig);
router.post("/DispatchGroup", updateDispatchGroup);

router.post("/DispatchConfig/dispatch", dispatchConfigAction);

router.delete("/SystemConfig/:id", deleteSystemConfig);
router.delete("/FeatureConfig/:id", deleteFeatureConfig);
router.delete("/ABTestConfig/:id", deleteABTestConfig);
router.delete("/CenterConfig/:id", deleteCenterConfig);
router.delete("/DispatchConfig/:id", deleteDispatchConfig);
router.delete("/DispatchGroup/:id", deleteDispatchGroup);

module.exports = router;
