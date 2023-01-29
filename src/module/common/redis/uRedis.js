const Redis = require("ioredis");
const host = process.env.URIDS_HOST || "localhost";
const port = process.env.URIDS_PORT || 6380;
const password = process.env.URIDS_PASSWORD || 123456;
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});

module.exports = {
  client
};
