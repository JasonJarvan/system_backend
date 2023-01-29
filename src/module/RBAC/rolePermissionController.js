const rolePermissionModel = require("./rolePermissionModel")();
const getRole = async (req, res) => {
  try {
    let { limit, offset } = req.query;
    let current = limit && limit > 0 ? offset / limit : 1;
    let { list, total } = await rolePermissionModel.getRole(req);
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
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};
const getPermission = async (req, res) => {
  try {
    let { pid, type } = req.query
    const list = await rolePermissionModel.getPermission(pid, type);
    return res.status(200).json({
      status: 200,
      data: { list }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};
const getRolePermission = async (req, res) => {
  try {
    const { roleId } = req.params;
    const list = await rolePermissionModel.getRolePermission(roleId);
    return res.status(200).json({
      status: 200,
      data: { list }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};
const getRoleAdmin = async (req, res) => {
  try {
    const { roleId } = req.params;
    const list = await rolePermissionModel.getRoleAdmin(roleId);
    return res.status(200).json({
      status: 200,
      data: { list }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};
const updatePermission = async (req, res) => {
  try {
    const msg = await rolePermissionModel.updatePermission(req.body);
    if (msg) {
      return res
        .status(200)
        .json({ code: 200, errorMessage: "successful " + msg });
    } else {

      return res.status(500).json({ code: 500, errorMessage: "failed" });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const updateRole = async (req, res) => {
  try {
    const { result } = await rolePermissionModel.updateRole(req.body);
    const msg =
      result.changedRows > 0
        ? "update role"
        : result.insertId
          ? "add role"
          : "";
    if (msg) {
      return res
        .status(200)
        .json({ code: 200, errorMessage: "successful " + msg });
    } else {
      return res.status(500).json({ code: 500, errorMessage: "failed" });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const updateRolePermission = async (req, res) => {
  try {
    await rolePermissionModel.updateRolePermission(req.body);
    return res.status(200).json({
      code: 200,
      errorMessage: "successful update role permission relation"
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const updateRoleAdmin = async (req, res) => {
  try {
    await rolePermissionModel.updateRoleAdmin(req.body);
    return res.status(200).json({
      code: 200,
      errorMessage: "successful update role admin relation"
    });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    if (!roleId)
      return res
        .status(500)
        .json({ status: 500, errorMessage: "missing argument" });
    await rolePermissionModel.deleteRole(roleId);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "successful delete role" });
  } catch (error) {
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    if (!permissionId)
      return res
        .status(500)
        .json({ status: 500, errorMessage: "missing argument" });
    await rolePermissionModel.deletePermission(permissionId);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "successful delete permission" });
  } catch (error) {

    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};


module.exports = {
  getRole,
  getPermission,
  getRolePermission,
  getRoleAdmin,
  updatePermission,
  updateRole,
  updateRolePermission,
  updateRoleAdmin,
  deleteRole,
  deletePermission,

};
