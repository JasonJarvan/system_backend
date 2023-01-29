const abtestServer = process.env.ABTEST_SERVER || "localabtestServer";
const axios = require("axios");

const getAbtests = (days, abTest) => {
  const url = `http://${abtestServer}/getABTestResult?startDate=${days[0]}&endDate=${days[1]}${abTest ? `&abTest=${abTest}` : ""}`;
  return axios.get(url).then(res => res.data).catch(err => console.log(err));
}

const getAbtestNames = () => {
  const url = `http://${abtestServer}/getABTests`;
  return axios.get(url).then(res => res.data).catch(err => console.log(err));
}

module.exports = {
  getAbtests,
  getAbtestNames
}