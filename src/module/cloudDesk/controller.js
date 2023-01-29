const model = require("./model")();
const { getListController } = require("../common/controlHelper");

const getDeskManager = (req, res) =>
  getListController(req, res, model.getDeskManager);

  module.exports = {
    getDeskManager,
  };
  