const axios = require("axios").default;
const messageBusApi = axios.create({
  baseURL: process.env.BUSS_DOMAIN,
  headers: {
    authorization: "eb14bdffa53a21d6e60bec826fd2659f"
  }
});
module.exports = {
  logicCometSend: async (data) => {
    const response = await messageBusApi({
      method: "post",
      url: "/logic/cometSend",
      data
    });
    return response.data;
  },

  getCompanyListApi: async (req) => {
    try {
      const url = `/company/data`;
      const body = JSON.stringify({
        page: req.query.offset,
        limit: req.query.limit
      });
      const options = {
        headers: {
          "Content-Type": "application/json",
          authorization: "eb14bdffa53a21d6e60bec826fd2659f"
        }
      };
      return messageBusApi.post(url, body, options).then((res) => {
        return res.data;
      });
    } catch (error) {
      console.log(error);
    }
  },

  getCompanyUserListApi: async (req) => {
    try {
      const url = `/company/enterpriseUsers`;
      const body = JSON.stringify({
        page: req.query.offset,
        limit: req.query.limit
      });
      const options = {
        headers: {
          "Content-Type": "application/json",
          authorization: "eb14bdffa53a21d6e60bec826fd2659f"
        }
      };
      return messageBusApi.post(url, body, options).then((res) => {
        return res.data;
      });
    } catch (error) {
      console.log(error);
    }
  }
};
