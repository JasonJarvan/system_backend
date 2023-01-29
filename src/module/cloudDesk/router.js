const express = require("express");
let router = express.Router();
 const {
    getDeskManager,
} = require("./controller");

router.get("/deskManager", getDeskManager);

module.exports = router;