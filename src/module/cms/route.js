const express = require("express");
const multer = require("multer");
const upload = multer();
let router = express.Router();

const {
  updateCmsArticle,
  getArticleById,
  getArticleList,
  deleteArticleById,
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
  getArticleNewsType,
  getNewsTypeByArticle,
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
} = require("./controller");

router.get("/article", getArticleList);
router.get("/article/:id", getArticleById);
router.get("/article/view/:id", cmsArticleViewed);
router.post("/article", updateCmsArticle);
router.get("/articleNewsType", getArticleNewsType);
router.get("/articleNewsType/:id", getNewsTypeByArticle);

router.delete("/article/:id", deleteArticleById);
router.get("/generate/article", generateArticle);
router.get("/generate/links", generateLinks);
router.get("/links", getLinksList);
router.post("/links", updateLinksList);
router.delete("/link/:id", deleteLink);

router.get("/picture", getPictureList);
router.get("/picture/:id", getPictureByID);
router.post("/picture", updatePicture);
router.post("/picture/upload", upload.any(), uploadPicture);
router.delete("/picture/:id", deletePicture);

router.get("/video", getVideoList);
router.get("/video/:id", getVideoByID);
router.delete("/video/:id", deleteVideo);
router.post("/video", updateVideo);
router.post("/video/upload", upload.any(), uploadVideo);

router.get("/dockeyword", getDocKeyWordList);
router.post("/dockeyword", updateDocKeyWord);
router.delete("/dockeyword/:id", deleteDocKeyWord);

router.get("/helpdoc", getHelpDocList);
router.get("/helpdoc/:id", getHelpDocByID);
router.post("/helpdoc", updateHelpDoc);
router.delete("/helpdoc/:id", deleteHelpDoc);

router.get("/FAQ/keyword", getFAQKeyWordList);
router.post("/FAQ/keyword", updateFAQKeyWord);
router.delete("/FAQ/keyword/:id", deleteFAQKeyWord);

router.get("/FAQ/doc", getFAQDocList);
router.get("/FAQ/doc/:id", getFAQDocByID);
router.post("/FAQ/doc", updateFAQDoc);
router.delete("/FAQ/doc/:id", deleteFAQDoc);
router.get("/FAQ/tags", getFAQTags);

router.get("/WorkOrder", getWorkOrderList);
router.get("/WorkOrder/:id", getWorkOrderByID);
router.post("/WorkOrder", updateWorkOrderChat);
router.post("/zip/upload", upload.any(), uploadZip);

module.exports = router;
