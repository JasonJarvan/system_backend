const ERROR = {
  USER_INFOMATION_MISSING: "用户信息不全",
  RESOURCE_NOT_FOUND: "资源不存在",
  SERVER_ERROR: "服务器错误 请联系管理员"
};

module.exports = function errorMsg(name) {
  return ERROR[name] || name;
};
