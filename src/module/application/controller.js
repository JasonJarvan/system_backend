const model = require("./applyModel")();
const { getListController, getController, updateListController, deleteListController } = require("../common/controlHelper");

const updateApply = (req, res) => updateListController(req, res, { modelFunc: model.updateApply });

const getApply = async (req, res) => {
  let applyid = parseInt(req.params.applyid);
  console.info(`getApply, req.params = ${applyid}`);
  try {
    let list = await model.getApply(applyid);
    console.log("getApply return: ", list);
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ code: 500, errorMessage: "server error" });
  }
}
const getApplyList = (req, res) => getListController(req, res, model.getApplyList);

const getVideoList = (req, res) => getListController(req, res, model.getVideoList);
const getVideoByID = (req, res) => getController(req, res, model.getVideoByID);
const updateVideo = (req, res) => updateListController(req, res, { modelFunc: model.updateVideo });
const deleteVideo = (req, res) => deleteListController(req, res, { modelFunc: model.deleteVideo });

const getWWWConfigList = (req, res) => getListController(req, res, model.getWWWConfigList);
const getWWWConfigByID = (req, res) => getController(req, res, model.getWWWConfigByID);
const updateWWWConfig = (req, res) => updateListController(req, res, { modelFunc: model.updateWWWConfig });
const deleteWWWConfig = (req, res) => deleteListController(req, res, { modelFunc: model.deleteWWWConfig });

module.exports = {
  getApply,
  updateApply,
  getApplyList,
  getVideoList,
  getVideoByID,
  updateVideo,
  deleteVideo,
  getWWWConfigList,
  getWWWConfigByID,
  updateWWWConfig,
  deleteWWWConfig
};
