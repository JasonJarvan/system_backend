const api = require("./api");
const model = require("./model")();
const { getListController, updateListController, deleteListController, getController } = require("../common/controlHelper");

const getMediaServer = async (req, res) => {
  return api.getMediaServer().then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getLogQuery = async (req, res) => {
  return api.getLogQuery(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getLogQueryRegion = async (req, res) => {
  return api.getLogQueryRegion(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getLogQueryLogset = async (req, res) => {
  return api.getLogQueryLogset(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getLogQueryTopic = async (req, res) => {
  return api.getLogQueryTopic(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getAPMLogNums = async (req, res) => {
  return model.getAPMLogNums(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getfuncName = async (req, res) => {
  return model.getfuncName(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getAPMLogs = async (req, res) => {
  return model.getAPMLogs(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getMsgStatus = async (req, res) => {
  return api.getMsgStatus(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  }).catch((err) => {
    return res.status(500).json({
      code: 500,
      error: err.message,
    })
  });
};


const getOperationLog = async (req, res) => {
  return model.getOperationLog(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  }).catch((err) => {
    return res.status(500).json({
      code: 500,
      error: err.message,
    })
  });
};

const getSettingRequest = (req, res) => getController(req, res, model.getSettingRequest);
const getTobmsgbus = (req, res) => getController(req, res, model.getTobmsgbus);
const getAndCtrlDelLog = (req, res) => getListController(req, res, model.getAndCtrlDelLog);
const getInstallInfo = (req, res) => getController(req, res, model.getInstallInfo);
const getControlInfo = (req, res) => getController(req, res, model.getControlInfo);
const getOnlineInfo = (req, res) => getController(req, res, model.getOnlineInfo);
const getUserInfo = (req, res) => getController(req, res, model.getUserInfo);
const getMsgMonitor = async (req, res) => {
  return model.getMsgMonitor(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};
const getMsgStatistics = async (req, res) => {
  return model.getMsgStatistics(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};


module.exports = {
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
};
