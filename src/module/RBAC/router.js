const express = require("express");
let router = express.Router();
const {
  getRole,
  getPermission,
  getRolePermission,
  getRoleAdmin,
  updatePermission,
  updateRole,
  updateRolePermission,
  updateRoleAdmin,
  deleteRole,
  deletePermission
} = require("./rolePermissionController");
const {
  getResources,
  deleteResources,
  addAndUpdateResources
} = require("./resourceController");

const {
  deleteRolePermission,
  deleteRoleAdmin,
  deleteRoleResource,
  createRoleResource,
  createRolePermission,
  createRoleAdmin,
  fetchRelation
} = require("./relationController");
const { menusForRole } = require("./menuController");
const a = require("./resourceService");
router.post("/rolePermission", createRolePermission);
router.delete("/rolePermission", deleteRolePermission);
router.post("/roleResource", createRoleResource);
router.delete("/roleResource", deleteRoleResource);
router.post("/roleAdmin", createRoleAdmin);
router.delete("/roleAdmin", deleteRoleAdmin);
router.get("/roleAdmin/:id", fetchRelation);
router.get("/menusAndPermission/:id", menusForRole);
router.get("/role", getRole);
router.get("/permission", getPermission);
router.get("/resources", getResources);
router.post("/permission", updatePermission);
router.post("/role", updateRole);
router.post("/resources", addAndUpdateResources);
router.delete("/role/:roleId", deleteRole);
router.delete("/permission/:permissionId", deletePermission);
router.delete("/resource/:id", deleteResources);

module.exports = router;
