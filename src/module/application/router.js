const express = require("express");
let router = express.Router();
const {
  getApply,
  updateApply,
  getApplyList,
  getVideoList,
  getVideoByID,
  updateVideo,
  deleteVideo,
  getWWWConfigList,
  getWWWConfigByID,
  updateWWWConfig,
  deleteWWWConfig
} = require("./controller");

router.post("/apply", updateApply);
router.get("/apply/:applyid", getApply);
router.get("/apply", getApplyList);
router.get("/video", getVideoList);
router.get("/video/:id", getVideoByID);
router.post("/video", updateVideo);
router.delete("/video/:id", deleteVideo);

router.get("/wwwconfig", getWWWConfigList);
router.get("/wwwconfig/:id", getWWWConfigByID);
router.post("/wwwconfig", updateWWWConfig);
router.delete("/wwwconfig/:id", deleteWWWConfig);

module.exports = router;
