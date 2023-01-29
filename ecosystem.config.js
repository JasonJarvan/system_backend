module.exports = {
  apps: [
    {
      name: "middle-backend",
      script: "./src/index.js",
      env: {
        NODE_ENV: "prod"
      },
      env_qas: {
        NODE_ENV: "qas"
      },
      env_deskin: {
        NODE_ENV: "deskin"
      }
    },
    {
      name: "count-cron", // 统计定时脚本
      script: "./cron/index.js",
      env: {
        NODE_ENV: "prod"
      },
      env_local: {
        NODE_ENV: "local"
      }
    }
  ]
};
