const jwt = require("jsonwebtoken");
const refreshSecret = process.env.JWT_REFRESH_SECRET || "test";
const jwtSecret = process.env.JWT_SECRET || "test";
const expressJwt = require("express-jwt");
const logger = require("../common/logger/logger");
const salt = 10;

const secretTokenCB = (req, payload, next) => {
  return next(null, jwtSecret);
};
const secretRefTokenCB = (req, payload, next) => {
  return next(null, refreshSecret);
};
const createToken = (param, expireTime, Secret) =>
  jwt.sign(
    {
      ...param
    },
    Secret,
    { expiresIn: expireTime }
  );
const validateToken = expressJwt({
  secret: secretTokenCB,
  algorithms: ["HS256"]
}).unless({
  path: ["/", "/api/admin/login"]//不需要验证token的路由白名单
});
const validateRefToken = expressJwt({
  secret: secretRefTokenCB,
  algorithms: ["HS256"]
});

const varifyRefresh = (oldToken) => jwt.verify(oldToken, refreshSecret);
module.exports = {
  validateToken,
  validateRefToken,
  createToken,
  varifyRefresh
};
