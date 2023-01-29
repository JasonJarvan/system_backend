const middleplatformLogDB =
  require("../common/mongodb")().db("middleplatform_log");

const appendLogsToMongo = async (data) => {
  await middleplatformLogDB.collection("action_log").insertOne(data);
  return "action log insert mongodb success";
};

module.exports = { appendLogsToMongo };
