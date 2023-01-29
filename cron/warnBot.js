const moment = require("moment");

const axios = require("axios");
const loggerBaseURL = process.env.LOGGER_HOST || "http://192.168.1.237";
const logger = axios.create({ baseURL: loggerBaseURL });
const LOGGER_WEBHOOK_KEY =
  process.env.LOGGER_WEBHOOK_KEY || "a1c56e1a-3e45-433a-a981-b7f3c1a0abba";
const warnbot = axios.create({
  baseURL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send"
});

const getLogger = async (query) => {
  const { data } = await logger({
    method: "post",
    url: "/logger/query",
    data: {
      dateArea: "last_1_hours",
      platfrom: "cls",
      query: `${query} | select count() as total`,
      topic: "test-todesk"
    }
  });
  return data.data ? data.data.total : 0;
};

const sendMsgToBot = async (content) => {
  const { data } = await warnbot({
    method: "post",
    params: {
      key: LOGGER_WEBHOOK_KEY
    },
    data: {
      msgtype: "markdown",
      markdown: {
        content
      }
    }
  });
  console.log("send msg to bot", data);
  return data;
};
const getContent = async (name, successKey, failKey) => {
  const success = await getLogger(successKey);
  const failed = await getLogger(failKey);
  const failedRate = ((failed / (success + failed)) * 100 || 0).toFixed(2);
  console.log({ name, success, failed, failedRate });
  return {
    success,
    failed,
    failedRate,
    content: `>${name}数：成功<font color="info">${success}</font>，失败<font color="warning">${failed}</font>，失败率<font color="warning">${failedRate}%</font>`
  };
};

const task = async () => {
  const date = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    // 验证码登录
    const phoneLogin = await getContent(
      "验证码登录",
      'logtype:"phoneLogin"',
      'logtype:"errorlog" AND ck_url:"/api/phone/verifyPhoneCode"'
    );
    /* 
    // 手机自动登录
    const autoLogin = await getContent(
      "手机自动登录",
      'logtype:"autoLogin" AND logintype:2',
      'logtype:"errorlog" AND logintype:2'
    );
    */
    if (phoneLogin.failedRate > 1) {
      const content = `${date} 前1小时登录统计
      ${phoneLogin.content} `;
      await sendMsgToBot(content);
    }
  } catch (error) {
    console.log("filed to run task");
    console.error(error);
  }
};
module.exports = task;
