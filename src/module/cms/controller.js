const cmsModel = require("./cmsModel")();
const api = require("./api");
const generateArticlePages = require("./cmsSync/article");
const generateHomePageLinks = require("./cmsSync/links");
const { getListController, updateListController, deleteListController, getController } = require("../common/controlHelper");

const updateCmsArticle = async (req, res) => {
  try {
    const { result } = await cmsModel.updateCmsArticle(req.body);
    return res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const getArticleById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await cmsModel.getArticleById(id, req.query.type);

    if (!result) {
      return res.status(400).json({
        status: 400,
        errorMessage: "Article does not exist"
      });
    }
    return res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const getArticleList = async (req, res) => {
  try {
    const { limit, offset, type, tag } = req.query;
    const current = limit && limit > 0 ? offset / limit : 1;
    const { list, total } = await cmsModel.getArticleList(
      offset,
      limit,
      type,
      tag
    );
    return res.status(200).json({
      status: 200,
      data: {
        list,
        current,
        pageSize: limit || 20,
        total
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const deleteArticleById = async (req, res) => {
  const id = req.params.id;
  try {
    const { result } = await cmsModel.deleteArticleById(id);
    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ code: 200, errorMessage: "successful delete article" });
    }
  } catch (error) {
    res.status(500).json({ code: 500, errorMessage: error });
  }
};
const getArticleNewsType = (req, res) => getListController(req, res, cmsModel.getArticleNewsType);
const getNewsTypeByArticle = (req, res) => getController(req, res, cmsModel.getNewsTypeByArticle);

const cmsArticleViewed = async (req, res) => {
  const id = req.params.id;
  try {
    const { result } = await cmsModel.cmsArticleViewed(id);
    return res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    res.status(500).json({ code: 500, errorMessage: error });
  }
};

const generateArticle = async (req, res) => {
  try {
    await generateArticlePages();
    return res.status(200).json({
      status: 200,
      data: "generate success."
    });
  } catch (error) {
    res.status(500).json({ code: 500, errorMessage: error });
  }
};

const getLinksList = async (req, res) => {
  try {
    const { result } = await cmsModel.getLinksList(req.query.type);
    return res.status(200).json({
      status: 200,
      data: { list: result }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const updateLinksList = async (req, res) => {
  try {
    const { list } = req.body;
    const { result } = await cmsModel.updateLinksList(list);
    return res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await cmsModel.deleteLink(id);
    return res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const generateLinks = async (req, res) => {
  try {
    await generateHomePageLinks();
    return res.status(200).json({
      status: 200,
      data: "generate success."
    });
  } catch (error) {
    res.status(500).json({ code: 500, errorMessage: error });
  }
};

const getPictureList = (req, res) => getListController(req, res, cmsModel.getPictureList);
const getPictureByID = (req, res) => getController(req, res, cmsModel.getPictureByID);
const updatePicture = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updatePicture });
const deletePicture = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deletePicture });
const uploadPicture = async (req, res) => {
  return api.uploadPicture(req)
    .then((data) => {
      console.log(data);
      return res.status(200).json({
        code: 200,
        data: data
      });
    });
};

const getVideoList = (req, res) => getListController(req, res, cmsModel.getVideoList);
const getVideoByID = (req, res) => getController(req, res, cmsModel.getVideoByID);
const deleteVideo = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deleteVideo });
const updateVideo = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateVideo });
const uploadVideo = async (req, res) => {
  return api.uploadVideo(req)
    .then((data) => {
      console.log(data);
      return res.status(200).json({
        code: 200,
        data: data
      });
    });
};

const getDocKeyWordList = (req, res) => getListController(req, res, cmsModel.getDocKeyWordList);
const updateDocKeyWord = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateDocKeyWord });
const deleteDocKeyWord = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deleteDocKeyWord });

const getHelpDocList = (req, res) => getListController(req, res, cmsModel.getHelpDocList);
const getHelpDocByID = (req, res) => getController(req, res, cmsModel.getHelpDocByID);
const updateHelpDoc = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateHelpDoc });
const deleteHelpDoc = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deleteHelpDoc });

const getFAQKeyWordList = (req, res) => getListController(req, res, cmsModel.getFAQKeyWordList);
const updateFAQKeyWord = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateFAQKeyWord });
const deleteFAQKeyWord = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deleteFAQKeyWord });

const getFAQDocList = (req, res) => getListController(req, res, cmsModel.getFAQDocList);
const getFAQDocByID = (req, res) => getController(req, res, cmsModel.getFAQDocByID);
const updateFAQDoc = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateFAQDoc });
const deleteFAQDoc = (req, res) => deleteListController(req, res, { modelFunc: cmsModel.deleteFAQDoc });
const getFAQTags = (req, res) => getListController(req, res, cmsModel.getFAQTags);

const getWorkOrderList = (req, res) => getListController(req, res, cmsModel.getWorkOrderList);
const getWorkOrderByID = (req, res) => getController(req, res, cmsModel.getWorkOrderByID);
const updateWorkOrderChat = (req, res) => updateListController(req, res, { modelFunc: cmsModel.updateWorkOrderChat });
const uploadZip = async (req, res) => {
  return api.uploadZip(req)
    .then((data) => {
      console.log(data);
      return res.status(200).json({
        code: 200,
        data: data
      });
    });
};
module.exports = {
  updateCmsArticle,
  getArticleById,
  getArticleList,
  deleteArticleById,
  getArticleNewsType,
  getNewsTypeByArticle,
  cmsArticleViewed,
  generateArticle,
  generateLinks,
  getLinksList,
  updateLinksList,
  deleteLink,
  getPictureList,
  getPictureByID,
  updatePicture,
  uploadPicture,
  deletePicture,
  getVideoList,
  getVideoByID,
  deleteVideo,
  updateVideo,
  uploadVideo,
  getDocKeyWordList,
  updateDocKeyWord,
  deleteDocKeyWord,
  getHelpDocList,
  getHelpDocByID,
  updateHelpDoc,
  deleteHelpDoc,
  getFAQKeyWordList,
  updateFAQKeyWord,
  deleteFAQKeyWord,
  getFAQDocList,
  getFAQDocByID,
  updateFAQDoc,
  deleteFAQDoc,
  getFAQTags,
  getWorkOrderList,
  getWorkOrderByID,
  updateWorkOrderChat,
  uploadZip,
};
