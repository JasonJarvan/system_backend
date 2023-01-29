const api = require("./api");

const getOverseaUsers = async (req, res) => {
  return api
    .getOverseaUsers(req)
    .then((data) => {
      return res.status(200).json({
        code: 200,
        data: data
      });
    })
    .catch((err) => {
      return res.status(500).json({
        code: 500,
        error: err.errmsg
      });
    });
};

module.exports = {
  getOverseaUsers
};
