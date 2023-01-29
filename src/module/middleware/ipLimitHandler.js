const whiteList = require("./ipWhiteList.json");
const ipFiliter = async (req, res, next) => {
  let auth = req.headers.authorization;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let infoString = `ip = ${ip} url = ${req.url}`;
  if (auth) {
    infoString += "auth = " + auth;
  }
  if (!whiteList.reduce((pre, current) => pre || ip.includes(current), false)) {
    console.error(
      `IP denied, ${infoString}, Request data:`,
      JSON.stringify(req.body)
    );
    return res
      .status(404)
      .json({ status: 404, errorMessage: "IP denied, ", infoString });
  }
  await next();
};
module.exports = { ipFiliter };
