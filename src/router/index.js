//const adminRouter = require("../module/adminCenter/router");
const errorMsg = require("../module/common/errorMessage");
//all router regist here
const { route } = require("./route")
module.exports = function loadRoute(app) {
  route.forEach(
    ele => app.use(ele.path, ele.router)
  )
  
  app.use("*", (req, res) =>
    res.status(404).json({
      code: 404,
      errorMessage: errorMsg("RESOURCE_NOT_FOUND")
    })
  );
  return app;
};
