const express = require("express");
const multer = require("multer");
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "text/csv") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

let router = express.Router();
const {
  getTranslateList,
  addTranslate,
  updateTranslate,
  deleteTranslate,
  importTranslate
} = require("./controller");

router.get("/multilanguage/translate", getTranslateList);
router.post("/multilanguage/translate", addTranslate);
router.put("/multilanguage/translate", updateTranslate);
router.post(
  "/multilanguage/translate/import",
  upload.single("file"),
  importTranslate
);
router.delete("/multilanguage/translate/:id", deleteTranslate);

module.exports = router;
