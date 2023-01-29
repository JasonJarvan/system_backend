const moment = require("moment");
const { appendLogsToMongo } = require("./appendLogsToMongo");
const monitorActionLogger = (req, res, next) => {
  res.on("finish", function () {
    if ("GET" != req.method) {
      const payload = {
        ...req.query,
        ...req.params,
        ...req.body
      };
      const info = req.user;
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const str = req.originalUrl.split("?")[0];
      const baseUrl = req.baseUrl;

      const status = res.statusCode || 200;
      const decodeURI = req.url;
      const tag = decodeURI.split("?")[0];

      if (200 == status || 304 == status) {
        const data = {
          logtype: "response",
          method: req.method,
          payload: JSON.stringify(payload),
          userId: info?.id,
          username: info?.username,
          role: info?.role,
          ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          url: req.headers.referer + str.substring(1),
          hostname: req.hostname,
          service: baseUrl,
          statusCode: status,
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
          tags: tag
        };
        if (process.env.NODE_ENV == "deskin") {
          console.log(data);
        } else {
          appendLogsToMongo(data).catch((error) => {
            console.error("log server error:", error);
          });
        }
      } else {
        const data = {
          logtype: "response",
          method: req.method,
          payload: JSON.stringify(payload),
          userId: info?.id,
          username: info?.username,
          role: info?.role,
          ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          url: req.headers.referer + str.substring(1),
          hostname: req.hostname,
          service: baseUrl,
          statusCode: status,
          errorInfo: res.statusMessage,
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
          tags: tag
        };
        if (process.env.NODE_ENV == "deskin") {
          console.log(data);
        } else {
          appendLogsToMongo(data).catch((error) => {
            console.error("log server error:", error);
          });
        }
      }
    }
  });
  next();
};

module.exports = { monitorActionLogger };
