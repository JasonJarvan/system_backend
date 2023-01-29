const api = require("../api/msgbus");
const {
  getListController,
  addListController,
  updateListController,
  deleteListController
} = require("../common/controlHelper");
const model = require("./model")();
const getConsumerList = (req, res) =>
  getListController(req, res, model.getConsumerList);
const updateConsumer = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateConsumer });
const addConsumer = (req, res) =>
  updateListController(req, res, { modelFunc: model.addConsumer });
const deleteConsumer = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteConsumer });

const getCrontabList = (req, res) =>
  getListController(req, res, model.getCrontabList);
const addCrontab = (req, res) =>
  addListController(req, res, { modelFunc: model.addCrontab });
const updateCrontab = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCrontab });
const deleteCrontab = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteCrontab });
const logicCometSend = async (req, res) => {
  try {
    const { protocolName, params } = req.body;
    const data = { protocolName };
    for (const param of params) {
      if (!param.value) continue;
      data[param.field] = param.value;
    }
    const response = await api.logicCometSend(data);
    for (const key in response.data) {
      const data = response.data[key];
      try {
        response.data[key] = JSON.parse(data);
      } catch (error) {
        //
      }
    }
    return res.status(200).json(response);
  } catch (error) {
    console.log("logicRequest Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const getErrorQueueList = (req, res) =>
  getListController(req, res, model.getErrorQueueList);

module.exports = {
  getConsumerList,
  updateConsumer,
  addConsumer,
  deleteConsumer,
  logicCometSend,
  getErrorQueueList,
  getCrontabList,
  addCrontab,
  updateCrontab,
  deleteCrontab
};
