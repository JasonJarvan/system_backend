const api = require("./api");
const model = require("./model")();
const {
  getListController, updateListController, deleteListController, getController
} = require("../common/controlHelper");

const getRedisQuery = (req, res) =>
  getController(req, res, model.getRedisQuery);

const getSetting = async (req, res) => {
  return api.getSetting(req.query).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};
const getServiceGover = (req, res) => getListController(req, res, model.getServiceGover);
const getServiceGoverByID = (req, res) => getController(req, res, model.getServiceGoverByID);
const updateServiceGover = (req, res) => updateListController(req, res, { modelFunc: model.updateServiceGover });
const deleteServiceGover = (req, res) => deleteListController(req, res, { modelFunc: model.deleteServiceGover });
const getServicePod = (req, res) => getListController(req, res, model.getServicePod);
const getServicePodByID = (req, res) => getController(req, res, model.getServicePodByID);
const getServicePodByServiceID = (req, res) => getController(req, res, model.getServicePodByServiceID);
const updateServicePod = (req, res) => updateListController(req, res, { modelFunc: model.updateServicePod });
const deleteServicePod = (req, res) => deleteListController(req, res, { modelFunc: model.deleteServicePod });
const refreshURL = async (req, res) => {
  return api.refreshURL(req).then((data) => {
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

module.exports = {
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
};
