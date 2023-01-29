const Redis = require("ioredis");
const host = process.env.UMSRIDS_HOST || "localhost";
const port = process.env.UMSRIDS_PORT || 6380;
const password = process.env.UMSRIDS_PASSWORD || 123456;
const client = new Redis({
  host,
  port,
  password,
  lazyConnect: process.env.NODE_ENV == "deskin"
});

module.exports = {
  client
};
