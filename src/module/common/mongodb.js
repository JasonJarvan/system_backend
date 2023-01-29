const { MongoClient } = require("mongodb");
const user = process.env.MONGO_ROOT_USER || "devroot";
const pwd = process.env.MONGO_ROOT_PASSWORD || "devroot";
const priServer = process.env.MONGO_PRI_SERVER || `localhost`;
const priPort = process.env.MONGO_PRI_PORT || `27019`;
const secServer = process.env.MONGO_SEC_SERVER;
const secPort = process.env.MONGO_SEC_PORT;

const dbUrlMap = {
  pri: `mongodb://${user}:${pwd}@${priServer}:${priPort}${secServer && secPort ? `,${secServer}:${secPort}` : ""}/`,
}
const client = (options = {}) => {
  const { dbname = "pri" } = options;
  const client = new MongoClient(
    dbname ? dbUrlMap[dbname] : dbUrlMap.pri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

  client.connect(async (err, client) => {
    if (err) {
      console.log(err);
      console.error.bind(console, "MongoDB connection error:");
    } else {
      // console.log("connected to the MongoDB");
      return client;
    }
  });

  return client;
}


module.exports = client;
