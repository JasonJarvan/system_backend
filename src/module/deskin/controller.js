const csvtojson = require("csvtojson");
const {
  getListController,
  updateListController,
  deleteListController
} = require("../common/controlHelper");
const model = require("./model")();
const getTranslateList = (req, res) =>
  getListController(req, res, model.getTranslateList);
const updateTranslate = (req, res) =>
  updateListController(req, res, { modelFunc: model.updateTranslate });
const addTranslate = async (req, res) => {
  try {
    const result = await model.addTranslate(req);
    if (result) {
      return res
        .status(500)
        .json({ code: 500, errorMessage: "部分添加失败！", failed: result });
    } else {
      return res
        .status(200)
        .json({ code: 200, errorMessage: "Successful added" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const deleteTranslate = (req, res) =>
  deleteListController(req, res, { modelFunc: model.deleteTranslate });
const importTranslate = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(500).json({ status: 500, errorMessage: "No file" });
    }
    const json = await csvtojson().fromString(file.buffer.toString("utf8"));
    const result = await model.importTranslate(json);
    return res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
module.exports = {
  getTranslateList,
  updateTranslate,
  addTranslate,
  deleteTranslate,
  importTranslate
};
