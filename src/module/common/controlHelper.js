const { reqLogger } = require("../../../tools/debugTools");

const getListController = async (req, res, getListModel) => {
  try {
    let { limit, offset } = req.query;
    // 返回的current非负
    let current = limit && limit > 0 && offset >= 0
      ? offset / limit
      : 0;
    let { list, total } = await getListModel(req);
    return res.status(200).json({
      status: 200,
      data: {
        list,
        current,
        pageSize: limit || 20,
        total
      }
    });
  } catch (error) {
    console.error("getListController Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const getController = async (req, res, getListModel) => {
  try {
    let list = await getListModel(req);
    return res.status(200).json({
      status: 200,
      data: {list}
    });
  } catch (error) {
    console.error("getController Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
}

const addListController = async (req, res, funcs) => {
  try {
    const msg = await funcs.modelFunc(req);
    funcs.redisFunc ? await funcs.redisFunc() : null;
    if (msg) {
      if(msg.id) {
        return res
        .status(200)
        .json({ code: 200, errorMessage: "Successful add" + msg.msg, data: {id: msg.id} });
      }
      return res
        .status(200)
        .json({ code: 200, errorMessage: "Successful add" + msg });
    } else {
      return res.status(500).json({ code: 500, errorMessage: "add Failed" });
    }
  } catch (error) {
    console.error("addListController Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const updateListController = async (req, res, funcs) => {
  try {
    const msg = await funcs.modelFunc(req);
    funcs.redisFunc ? await funcs.redisFunc() : null;
    if (msg) {
      return res
        .status(200)
        .json({ code: 200, message: msg });
    } else {
      return res.status(500).json({ code: 500, errorMessage: "Update Failed" });
    }
  } catch (error) {
    console.error("updateListController Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

const deleteListController = async (req, res, funcs) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(500)
        .json({ status: 500, errorMessage: "Missing argument" });
    const msg = await funcs.modelFunc(id);
    funcs.redisFunc ? await funcs.redisFunc : null;
    return res
      .status(200)
      .json({ code: 200, errorMessage: "Successful deleted" + msg });
  } catch (error) {
    console.error("deleteListController Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};

module.exports = { getListController, addListController, updateListController, deleteListController, getController };
