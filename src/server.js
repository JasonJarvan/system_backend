if (process.env.NODE_ENV == "production") {
  require("dotenv").config({ path: `./env/.env` });
} else if (process.env.NODE_ENV == "development" || process.env.NODE_ENV == "local") {
  require("dotenv").config({ path: `./env/.env.local` });
}
else {
  require("dotenv").config({ path: `./env/.env.${process.env.NODE_ENV}` });
}
const express = require("express");
const expressErrorhandle = require("./module/middleware/expressErrorhandle");
const {monitorActionLogger} = require("./module/middleware/monitorActionLogger");
const cors = require("cors");
const router = require("./router");
const { validateToken } = require("./module/middleware/token");
const { resourceValidate } = require("./module/middleware/RBAC");
const { logger: actionlogger } = require("./module/middleware/actionlogger");
const { ipFiliter } = require("./module/middleware/ipLimitHandler");

module.exports = function server() {
  const PORT = process.env.PORT || 5000;
  let app = express();

  app
    .use(ipFiliter)
    .use(cors())
    .use(validateToken)
    .use(resourceValidate)
    .use(actionlogger)
    .use(express.json({ limit: "10mb" }))
    .use(monitorActionLogger)
    ;

  // load router
  app = router(app);
  function start() {
    app
      .use(expressErrorhandle)
      .listen(PORT, () => console.log(`Listening on ${PORT}`));
  }
  return {
    start
  };
};
