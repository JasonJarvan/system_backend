let config = require("./config")
const permissionRole = require("./permissionRoleModel")()
const resourceValidate = async (req, res, next) => {
    //let apiResource=config.permit[req.user.role[0]].apiResource
    let url = req.url
    if (config.whiteList.includes(url)) {
        next()
        return
    }
    if (!req.user) {
        res.status(401).json({ status: 401, errorMessage: "you don't have permission" });
        return
    }
    let method = req.method.toLowerCase()
    try {
        let apiResourcePermission = await permissionRole.getValidResource(req.user.role, method)
        let access = apiResourcePermission.reduce(
            (pre, current) => pre || url.match(config.pre + current.url), false
        )
        if (!access) {
            res.status(401).json({ status: 401, errorMessage: "you don't have permission" });
            return
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, errorMessage: "fail to validate permission" });
        return;
    }
    next()
    return
}
const getUserMenu = async (roles) => {
    //let route = config.permit[roles[0]].route
    let menu = await permissionRole.getMenus(roles)
    return menu
}
const getUserAccess = async (roles) => {
    let accessdb = ['/account/center']
    try {
        let accesses = await permissionRole.getAllValidResource(roles)
        accesses.forEach(access => {
            accessdb.push(access.path)
        });
    } catch (error) {
        console.log(error)
    }
    return accessdb
}
module.exports = { resourceValidate, getUserMenu, getUserAccess }