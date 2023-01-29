let permissionModel = require("./permissionModel")();
let resourceModel = require("./resouceModel")();
const menusForRole = async (req, res) => {
  try {
    let { id } = req.params;
    const { menus, permissions } = await permissionModel.getMenuByRoleId(id);
    const resources = await resourceModel.getResourcebyRoleid(id);
    res.status(200).json({
      code: 200,
      data: {
        menus,
        permissions,
        resources
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      errorMessage: error.message
    });
  }
};

module.exports = {
  menusForRole
};
