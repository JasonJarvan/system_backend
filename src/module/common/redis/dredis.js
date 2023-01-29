const Redis = require("ioredis");
const host = process.env.DRIDS_HOST || "localhost";
const port = process.env.DRIDS_PORT || 6380;
const password = process.env.DRIDS_PASSWORD || 123456;
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});

module.exports = {
  client
};
