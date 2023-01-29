const moment = require("moment");
const api = require("./api");
const credisService = require("../common/redis/credis");
const dashboardModel = require("./dashboardModel");
const { getListController, updateListController, deleteListController, getController } = require("../common/controlHelper");

const dashboard = async (req, res) => {
  const online_count = await credisService.getOnlineTdCount();
  const control_count = await credisService.getControlTdCount();
  const data = await dashboardModel.getTodeskCount();
  data.countData = { ...data.countData, ...control_count };
  return res.status(200).json({
    status: 200,
    data: {
      ...data,
      online: online_count
    }
  });
};

const getCount = async (req, res) => {
  const data = await dashboardModel.getCount();
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getNewCount = async (req, res) => {
  const data = await dashboardModel.getNewCount();
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getWeekTdCount = async (req, res) => {
  const data = await dashboardModel.getWeekTdCount();
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getOrderAnalysis = async (req, res) => {
  const data = await dashboardModel.getOrderAnalysis();
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getProductOrderAnalysis = async (req, res) => {
  const data = await dashboardModel.getProductOrderAnalysis(req);
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getGMV = async (req, res) => {
  const data = await dashboardModel.getGMV(req);
  return res.status(200).json({
    status: 200,
    data: data
  });
};
const getEnterpriseAnalysis = async (req, res) => {
  const data = await dashboardModel.getEnterpriseAnalysis();
  return res.status(200).json({
    status: 200,
    data: data
  });
};

const getOverseaAnalysis = async (req, res) => {
  const data = await dashboardModel.getOverseaAnalysis();
  return res.status(200).json({
    status: 200,
    data: data
  });
  // return api.getOverseaAnalysis().then((data) => {
  //   return res.status(200).json({
  //     code: 200,
  //     data: data
  //   });
  // }).catch((err) => {
  //   return res.status(500).json({
  //     code: 500,
  //     error: err.errmsg,
  //   })
  // });
};

const getEnterpriseCount = (req, res) =>
  getController(req, res, dashboardModel.getEnterpriseCount);
const getUserRenewal = (req, res) =>
  getListController(req, res, dashboardModel.getUserRenewal);
const getUserPaid = (req, res) =>
  getListController(req, res, dashboardModel.getUserPaid);

module.exports = {
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
  getUserPaid
};
