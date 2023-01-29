const express = require("express");
let router = express.Router();
const {
  getRedisQuery,
  getSetting,
  getServiceGover,
  getServiceGoverByID,
  updateServiceGover,
  deleteServiceGover,
  getServicePod,
  getServicePodByID,
  getServicePodByServiceID,
  updateServicePod,
  deleteServicePod,
  refreshURL,
} = require("./controller");

router.get("/redisQuery", getRedisQuery);
router.get("/setting", getSetting);
router.get("/serviceGover", getServiceGover);
router.get("/serviceGover/:id", getServiceGoverByID);
router.post("/serviceGover", updateServiceGover);
router.delete("/serviceGover/:id", deleteServiceGover);
router.get("/servicePod", getServicePod);
router.get("/servicePod/:id", getServicePodByID);
router.get("/servicePodByServiceID/:id", getServicePodByServiceID);
router.post("/servicePod", updateServicePod);
router.delete("/servicePod/:id", deleteServicePod);
router.post("/refreshURL", refreshURL);

module.exports = router;
