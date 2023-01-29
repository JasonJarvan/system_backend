const api = require("./api");
const model = require("./model");

const getAbtests = async (req, res) => {
  return api.getAbtests(req.query.days, req.query.abTest).then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getAbtestNames = async (req, res) => {
  return api.getAbtestNames().then((data) => {
    return res.status(200).json({
      code: 200,
      data: data
    });
  });
};

const getVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    if (versionId) {
      const version = await model.getVersion(versionId);
      return res.status(200).json({
        status: 200,
        data: version
      });
    } else {
      const { limit, offset } = req.query;
      const current = limit && limit > 0 ? offset / limit : 1;
      const { list, total } = await model.getVersionList(offset, limit);
      return res.status(200).json({
        status: 200,
        data: {
          list,
          current,
          pageSize: limit || 20,
          total
        }
      });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};

const updateVersion = async (req, res) => {
  try {
    const { result } = await model.updateVersion(req.body);
    const msg =
      result.changedRows > 0
        ? "update version detail"
        : result.insertId
        ? "add version"
        : "";
    if (msg) {
      return res.status(200).json({
        code: 200,
        data: { id: result.insertId },
        errorMessage: "successful " + msg
      });
    } else {
      return res.status(500).json({ code: 500, errorMessage: "failed" });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const deleteVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    if (!versionId)
      return res
        .status(500)
        .json({ status: 500, errorMessage: "missing argument" });
    await model.deleteVersion(versionId);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "successful delete version" });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const getVersionGray = async (req, res) => {
  try {
    const { versionId } = req.params;
    const list = await model.getVersionGray(versionId);
    return res.status(200).json({
      status: 200,
      data: { list }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const updateVersionGray = async (req, res) => {
  try {
    const { list } = req.body;
    if (list && list.length > 0) {
      await model.addVersionGray(list);
      return res.status(200).json({
        code: 200,
        errorMessage: "successful add version gray"
      });
    } else {
      await model.updateVersionGray(req.body);
      return res.status(200).json({
        code: 200,
        errorMessage: "successful update version gray"
      });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const deleteVersionGray = async (req, res) => {
  try {
    const { grayId } = req.params;
    if (!grayId) {
      return res
        .status(500)
        .json({ status: 500, errorMessage: "missing argument" });
    }
    await model.deleteVersionGray(grayId);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "successful delete gray" });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
module.exports = {
  getAbtests,
  getAbtestNames,
  getVersion,
  updateVersion,
  deleteVersion,
  getVersionGray,
  updateVersionGray,
  deleteVersionGray
};
