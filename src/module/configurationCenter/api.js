var axios = require('axios');
const BUSS_DOMAIN = process.env.BUSS_DOMAIN;

const sendCustomMail = (data) => {
  var data = JSON.stringify(data);
  var config = {
    method: 'post',
    url: `${BUSS_DOMAIN}/user/sendCustomMail`,
    headers: {
      'AUTHORIZATION': 'eb14bdffa53a21d6e60bec826fd2659f',
      'Content-Type': 'application/json'
    },
    data: data
  };

  return axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      return JSON.stringify(response.data);
    })
    .catch(function (error) {
      console.error(error);
      throw new Error(error);
    });
}

module.exports = {
  sendCustomMail
}
