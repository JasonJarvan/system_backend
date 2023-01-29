const host = process.env.ABTEST_SERVER || "localhost";
const axios = require("axios");
const loggerBaseURL = process.env.LOGGER_HOST || "http://192.168.16.57:8080";
const logger = axios.create({ baseURL: loggerBaseURL });
const { smsClient } = require("../common/tencentCloud");

const getMediaServer = () => {
  try {
    const url = `http://106.75.147.204/serverinfo.php`;
    return axios.get(url).then(res => res.data);
  } catch (error) {
    console.log(error);
  }
}

const getLogQuery = (data) => {
  const config = {
    method: "post",
    url: "/logger/query",
    headers: {
      "Content-Type": "application/json"
    },
    ...data
  };
  console.log(config);
  return logger(config)
    .then(function (response) {
      // console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

const getLogQueryRegion = () => {
  const config = {
    method: 'get',
    url: '/cls/queryRegion',
    headers: {}
  };

  return logger(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

const getLogQueryLogset = () => {
  const config = {
    method: 'get',
    url: '/cls/queryLogset',
    headers: {}
  };

  return logger(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

const getLogQueryTopic = (query) => {
  const { regionName } = query;
  const config = {
    method: 'get',
    url: encodeURI(`/cls/queryTopic?${regionName ? `region=${regionName}&` : ''}logsetId=`),
    headers: {}
  };

  return logger(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

const getMsgStatus = (params) => {
  const options = JSON.parse(params.data)
  // console.log(JSON.parse(params.data));
  return smsClient.PullSmsSendStatusByPhoneNumber(options).then(
    (data) => {
      return data;
    },
    (err) => {
      console.error("error", err);
      throw err;
    }
  );
}

module.exports = {
  getMediaServer,
  getLogQuery,
  getLogQueryRegion,
  getLogQueryLogset,
  getLogQueryTopic,
  getMsgStatus,
}
