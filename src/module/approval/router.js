const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  getFlowList,
  getFlowDetail,
  getFlowListNums,
  addFlow,
  approveFlow,
  addRefund,
  getRefundList,
  addUpgrade,
  getUpgradeList
} = require("./controller");

router.use(validateToken);

router.get("/flow", getFlowList);
router.put("/flow", addFlow);
router.get("/flow/detail/:id", getFlowDetail);
router.get("/flow/counts", getFlowListNums);
router.post("/flow/approve", approveFlow);
// 退款审批
router.put("/flow/refund", addRefund);
router.get("/flow/refund/:id", getRefundList);
// 权益升级
router.put("/flow/upgrade", addUpgrade);
router.get("/flow/upgrade/:id", getUpgradeList);

module.exports = router;
