const lxhDomain = process.env.LWH_DOMAIN || "http://192.168.16.5:8013";
const axios = require("axios");
const logger = require("axios").create({
  baseURL: process.env.LOGGER_HOST || "http://106.75.166.91"
});

module.exports = function api() {
  let that = this;

  that.orderRefund = (data) => {
    const config = {
      method: 'post',
      url: `${lxhDomain}/api/ordermanage/order/refund`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { token: "", ...data }
    };

    return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  that.generateOrder = (data) => {
    const config = {
      method: 'post',
      url: `${lxhDomain}/api/ordermanage/order/artificial`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { token: "", ...data }
    };

    return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  // generateOrder({ userid: 35140, spuId: 3, amount: 1, desc: "测试", day: 1, actualPrice: 0, orderType: 1 })

  that.getUserPublicInfo = (data) => {
    const config = {
      method: 'get',
      baseURL: lxhDomain,
      url: `/api/user/public_info`,
      params: { userid: data.userid },
      headers: {
        'Content-Type': 'application/json'
      },
    };

    return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  that.getUserLoginList = async (data) => {
    const userLoginConfig = {
      method: "post",
      url: "/logger/query",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        platfrom: "cls",
        topic: "event",
        dateArea: "last_3_days",
        query: `logtype:"user_login" AND 
                (dstuser:"${data.userid}" OR dstuser:"${data.userid}"
                OR srcuser:"${data.userid}" OR srcuser:"${data.userid}")`
      }
    };
    const userLoginList = await logger(userLoginConfig)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return userLoginList;
  }
  // this.getUserLoginList({ phone: "17751760171", email: "17751760171" })
  that.getUserConnList = async (data) => {
    const userConnConfig = {
      method: "post",
      url: "/logger/query",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        platfrom: "cls",
        topic: "event",
        dateArea: "last_3_days",
        query: `logtype:"newconnect" AND srcuser:"${data.userid}"`
      }
    };
    const userConnList = await logger(userConnConfig)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return userConnList;
  }
  // this.getUserConnList({ userid: "2782534" })
  return that;
}
