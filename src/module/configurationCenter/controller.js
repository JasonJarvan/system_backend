const configurationModel = require("./configurationModel")();
const { client: dredis } = require("../common/redis/dredis");
const { getListController, updateListController, deleteListController, getController } = require("../common/controlHelper");

const getSystemConfig = (req, res) => getListController(req, res, configurationModel.getSystemConfig);
const getFeatureConfig = (req, res) => getListController(req, res, configurationModel.getFeatureConfig);
const getABTestConfig = (req, res) => getListController(req, res, configurationModel.getABTestConfig);
const getVersionConfig = (req, res) => getController(req, res, configurationModel.getVersionConfig);
const getCenterConfig = (req, res) => getListController(req, res, configurationModel.getCenterConfig);
const getCenterConfigByID = (req, res) => getController(req, res, configurationModel.getCenterConfigByID);
const getCenterConfigTemp = (req, res) => getController(req, res, configurationModel.getCenterConfigTemp);
const getDispatchConfig = (req, res) => getListController(req, res, configurationModel.getDispatchConfig);
const getDispatchConfigByID = (req, res) => getController(req, res, configurationModel.getDispatchConfigByID);
const getDispatchGroup = (req, res) => getListController(req, res, configurationModel.getDispatchGroup);
const getDispatchGroupByID = (req, res) => getController(req, res, configurationModel.getDispatchGroupByID);
const getDispatchConfigAdmin = (req, res) => getListController(req, res, configurationModel.getDispatchConfigAdmin);
const getAdminByDispatchConfig = (req, res) => getController(req, res, configurationModel.getAdminByDispatchConfig);
const updateSystemConfig = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateSystemConfig });
const updateFeatureConfig = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateFeatureConfig });
const updateABTestConfig = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateABTestConfig });
const updateVersionConfig = async (req, res) => updateListController(req, res,
  {
    modelFunc: configurationModel.updateVersionConfig,
    redisFunc: () => {
      dredis.hmset(`todesk_version:${req.body.config_name}`,
        "update", `${req.body.updateType}`,
        "version", `${req.body.version}`,
        "url", `${req.body.link}`,
        "update_content", `${req.body.updateContent}`);
    }
  });
const updateCenterConfig = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateCenterConfig });
const updateDispatchConfig = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateDispatchConfig });
const updateDispatchGroup = (req, res) => updateListController(req, res, { modelFunc: configurationModel.updateDispatchGroup });

const dispatchConfigAction = (req, res) => updateListController(req, res, { modelFunc: configurationModel.dispatchConfigAction });

const deleteSystemConfig = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteSystemConfig });
const deleteFeatureConfig = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteFeatureConfig });
const deleteABTestConfig = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteABTestConfig });
const deleteCenterConfig = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteCenterConfig });
const deleteDispatchConfig = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteDispatchConfig });
const deleteDispatchGroup = (req, res) => deleteListController(req, res, { modelFunc: configurationModel.deleteDispatchGroup });

module.exports = {
  getSystemConfig,
  getFeatureConfig,
  getABTestConfig,
  getVersionConfig,
  getCenterConfig,
  getCenterConfigByID,
  getCenterConfigTemp,
  updateSystemConfig,
  updateFeatureConfig,
  updateABTestConfig,
  updateCenterConfig,
  updateVersionConfig,
  deleteSystemConfig,
  deleteFeatureConfig,
  deleteABTestConfig,
  deleteCenterConfig,
  getDispatchConfig,
  getDispatchConfigByID,
  updateDispatchConfig,
  dispatchConfigAction,
  deleteDispatchConfig,
  getDispatchGroup,
  getDispatchGroupByID,
  updateDispatchGroup,
  deleteDispatchGroup,
  getDispatchConfigAdmin,
  getAdminByDispatchConfig
};
