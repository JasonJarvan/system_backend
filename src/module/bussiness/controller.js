const api = require("../api/msgbus");
const {
  getListController,
  getController,
  updateListController,
  deleteListController
} = require("../common/controlHelper");
const model = require("./model");
const getCompanyList = (req, res) => {
  return api.getCompanyListApi(req).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};
const getCompanyListV2 = (req, res) =>
  getListController(req, res, model.getCompanyList);
const getCompanyListCount = (req, res) =>
  getController(req, res, model.getCompanyListCount);
const getCompanyByID = (req, res) =>
  getController(req, res, model.getCompanyByID);
const getCompanyInfoByID = (req, res) =>
  getController(req, res, model.getCompanyInfoByID);
const getCompanyUserList = (req, res) =>
  getListController(req, res, model.getCompanyUserList);
const getCompanyUserByID = (req, res) =>
  getController(req, res, model.getCompanyUserByID);
const updateCompanyUserLock = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompanyUserLock });
const updateCompanyUser = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompanyUser });
const getCompanyDeviceList = (req, res) =>
  getListController(req, res, model.getCompanyDeviceList);

const getCompanyPermissionValue = async (req, res) => {
  try {
    const result = await model.getCompanyPermissionValue();
    return res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.log("getCompanyPermissionValue Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: "Server Error" });
  }
};
const getCompanyPermission = (req, res) =>
  getListController(req, res, model.getCompanyPermission);
const updateCompanyPermission = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompanyPermission });
const deleteCompanyPermission = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteCompanyPermission });

const getCompanyVersionValue = async (req, res) => {
  try {
    const result = await model.getCompanyVersionValue();
    return res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.log("getCompanyVersionValue Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: "Server Error" });
  }
};
const getCompanyVersion = (req, res) =>
  getListController(req, res, model.getCompanyVersion);
const updateCompanyVersion = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompanyVersion });
const deleteCompanyVersion = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteCompanyVersion });

const getCompanyUserPermission = (req, res) =>
  getListController(req, res, model.getCompanyUserPermission);
const updateCompanyUserPermission = (req, res) =>
  updateListController(req, res, {
    modelFunc: model.updateCompanyUserPermission
  });
const updateCompany = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompany });
const updateCompanyStatus = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateCompanyStatus });

const searchCompanyName = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) return res.status(200).json({ code: 200, data: [] });
    const result = await model.searchCompanyName(search);
    return res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.log("searchCompanyName Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: "Server Error" });
  }
};

const getCompanyConnectionLog = (req, res) =>
  getListController(req, res, model.getCompanyConnectionLog);
const getCompanyConnectionLogCount = (req, res) =>
  getController(req, res, model.getCompanyConnectionLogCount);
const getCompanyLoginLog = (req, res) =>
  getListController(req, res, model.getCompanyLoginLog);

const getGpuList = (req, res) => getListController(req, res, model.getGpuList);
const getGpuWhitelist = (req, res) =>
  getListController(req, res, model.getGpuWhitelist);
const deleteGpuWhitelist = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteGpuWhitelist });
const updateGpuWhitelist = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateGpuWhitelist });

const getGhostBlackList = (req, res) =>
  getListController(req, res, model.getGhostBlackList);
const deleteGhostBlackList = (req, res) =>
  updateListController(req, res, { modelFunc: model.deleteGhostBlackList });
const addGhostBlackList = (req, res) =>
  updateListController(req, res, { modelFunc: model.addGhostBlackList });

const getCompanyOrder = (req, res) => getListController(req, res, model.getCompanyOrder);
const getCompanyOrderCount = (req, res) =>
  getController(req, res, model.getCompanyOrderCount);
const getCompanyListSimple = (req, res) => getListController(req, res, model.getCompanyListSimple);
const getCompanyOrderByID = (req, res) => getController(req, res, model.getCompanyOrderByID);
const getCompanyOrdersByCompanyID = (req, res) => getController(req, res, model.getCompanyOrdersByCompanyID);
const updateCompanyOrder = (req, res) => updateListController(req, res, { modelFunc: model.updateCompanyOrder });
const changeCompanyOrderStatus = (req, res) => updateListController(req, res, { modelFunc: model.changeCompanyOrderStatus });
const importCompanyOrder = (req, res) => updateListController(req, res, { modelFunc: model.importCompanyOrder });

const getMD5List = (req, res) => getListController(req, res, model.getMD5List);
const getMD5ByID = (req, res) => getController(req, res, model.getMD5ByID);
const deleteMD5 = (req, res) => deleteListController(req, res, { modelFunc: model.deleteMD5 });
const updateMD5 = (req, res) => updateListController(req, res, { modelFunc: model.updateMD5 });

module.exports = {
  getCompanyList,
  getCompanyListV2,
  getCompanyListCount,
  getCompanyByID,
  getCompanyInfoByID,
  getCompanyUserList,
  getCompanyUserByID,
  updateCompanyUserLock,
  updateCompanyUser,
  getCompanyDeviceList,
  getCompanyPermission,
  getCompanyPermissionValue,
  getCompanyUserPermission,
  updateCompanyPermission,
  updateCompanyUserPermission,
  deleteCompanyPermission,
  updateCompany,
  updateCompanyStatus,
  searchCompanyName,
  getGpuList,
  getGpuWhitelist,
  deleteGpuWhitelist,
  updateGpuWhitelist,
  getGhostBlackList,
  deleteGhostBlackList,
  addGhostBlackList,
  getCompanyVersion,
  updateCompanyVersion,
  deleteCompanyVersion,
  getCompanyVersionValue,
  getCompanyConnectionLog,
  getCompanyConnectionLogCount,
  getCompanyLoginLog,
  getCompanyOrder,
  getCompanyOrderCount,
  getCompanyListSimple,
  getCompanyOrderByID,
  getCompanyOrdersByCompanyID,
  updateCompanyOrder,
  changeCompanyOrderStatus,
  importCompanyOrder,
  getMD5List,
  getMD5ByID,
  deleteMD5,
  updateMD5,
};
