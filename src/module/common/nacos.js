const { NacosConfigClient } = require("nacos");
const server = process.env.NACOS_SERVER;
const username = process.env.NACOS_USER;
const password = process.env.NACOS_PASS;
let configClient;
if (process.env.NODE_ENV == "deskin") {
  configClient = {
    subscribe: () => {}
  };
} else {
  configClient = new NacosConfigClient({
    logger: console,
    serverAddr: server,
    namespace: "system_backend",
    username,
    password
  });
}
const subscribeConfig = async (dataId, service) => {
  return new Promise((resolve) => {
    configClient.subscribe(
      { dataId, group: "DEFAULT_GROUP" },
      async (jsonString) => {
        try {
          const json = JSON.parse(jsonString);
          await service.init(json);
          resolve();
        } catch (err) {
          await service.init();
          resolve();
        }
      }
    );
  });
};
module.exports = { configClient, subscribeConfig };
