const logger = require("../common/logger/logger");
const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  getOverseaUsers
} = require("./controller");
router.use(validateToken);
router.get("/overseaUsers", getOverseaUsers);

module.exports = router;
