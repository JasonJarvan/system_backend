const host = process.env.ABTEST_SERVER || "localhost";
const axios = require("axios");
const { cdnClient } = require("../common/tencentCloud");

const getSetting = (data) => {
  const config = {
    method: 'post',
    url: 'Https://st.todesk.com/config-center/sync-config?fullUpdate=true',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}

const refreshURL = (req) => {
  const config = req.body;
  const { Method, ...rest } = config;
  if (Method == "directory") {
    return cdnClient.PurgePathCache(rest).then(
      (data) => {
        console.log(data);
        return data;
      },
      (err) => {
        throw err;
      }
    )
  } else {
    return cdnClient.PurgeUrlsCache(rest).then(
      (data) => {
        console.log(data);
        return data;
      },
      (err) => {
        throw err;
      }
    );
  }
}
module.exports = {
  getSetting,
  refreshURL,
}
