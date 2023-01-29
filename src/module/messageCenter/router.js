const express = require("express");
let router = express.Router();
const {
  getConsumerList,
  addConsumer,
  updateConsumer,
  deleteConsumer,
  logicCometSend,
  getErrorQueueList,
  getCrontabList,
  addCrontab,
  updateCrontab,
  deleteCrontab,
} = require("./controller");

router.get("/error", getErrorQueueList);
router.get("/consumer", getConsumerList);
router.post("/consumer", addConsumer);
router.put("/consumer", updateConsumer);
router.delete("/consumer/:id", deleteConsumer);
router.post("/logic/cometSend", logicCometSend);

router.get("/crontab", getCrontabList);
router.post("/crontab", addCrontab);
router.put("/crontab", updateCrontab);
router.delete("/crontab/:id", deleteCrontab);

module.exports = router;
