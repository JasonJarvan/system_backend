const logger = require("../common/logger/logger");
const expressErrorhandle = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res
      .status(err.status)
      .send({ status: err.status, errorMessage: err.message });
    //logger.error(err);

    return;
  }
  if (err) {
    res
      .status(err.code || 500)
      .send({ code: err.code || 500, msg: err.message });
  }
  next();
};
module.exports = expressErrorhandle;
