const model = require("./model");
const {
  getListController,
  updateListController,
  deleteListController,
  getController
} = require("../common/controlHelper");
const getConfig = (req, res) => getController(req, res, model.getConfig);
const getFlowList = (req, res) =>
  getListController(req, res, model.getFlowList);
const getFlowListNums = (req, res) =>
  getController(req, res, model.getFlowListNums);
const getFlowDetail = (req, res) =>
  getController(req, res, model.getFlowDetail);
const getRefundList = (req, res) =>
  getController(req, res, model.getRefundList);
const getUpgradeList = (req, res) =>
  getController(req, res, model.getUpgradeList);

const addFlow = async (req, res) => {
  try {
    const { type, params, userid, order_id, remark, extra } = req.body;
    const { id: admin_id } = req.user;
    await model.addFlow(
      type,
      admin_id,
      params,
      userid,
      order_id,
      remark,
      extra
    );
    return res.status(200).json({ code: 200, message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, errorMessage: "add Failed" });
  }
};
const addRefund = async (req, res) => {
  try {
    const { id: admin_id } = req.user;
    await model.addRefund({ admin_id, ...req.body });
    return res.status(200).json({ code: 200, message: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, errorMessage: error.message || "add Failed" });
  }
};
const addUpgrade = async (req, res) => {
  try {
    const { id: admin_id } = req.user;
    await model.addUpgrade({ admin_id, ...req.body });
    return res.status(200).json({ code: 200, message: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, errorMessage: error.message || "add Failed" });
  }
};
const approveFlow = async (req, res) => {
  try {
    const msg = await model.approveFlow(req);
    return res.status(200).json({ code: 200, message: msg || "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, errorMessage: error.message || "approveFlow Failed" });
  }
};
module.exports = {
  getConfig,
  getFlowList,
  getFlowListNums,
  getFlowDetail,
  addFlow,
  approveFlow,
  addRefund,
  getRefundList,
  addUpgrade,
  getUpgradeList
};
