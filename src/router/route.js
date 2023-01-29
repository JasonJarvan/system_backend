const route = [
  {
    path: "/api/admin",
    router: require("../module/adminCenter/router")
  },
  {
    path: "/api/user",
    router: require("../module/userCenter/router")
  },
  {
    path: "/api/configuration",
    router: require("../module/configurationCenter/router")
  },
  {
    path: "/api/admin/RBAC",
    router: require("../module/RBAC/router")
  },
  {
    path: "/api/abtest",
    router: require("../module/abtest/router")
  },
  {
    path: "/api/cms",
    router: require("../module/cms/route")
  },
  {
    path: "/api/dashboard",
    router: require("../module/dashboard/router")
  },
  {
    path: "/api/application",
    router: require("../module/application/router")
  },
  {
    path: "/api/bussiness",
    router: require("../module/bussiness/router")
  },
  {
    path: "/api/data",
    router: require("../module/data/router")
  },
  {
    path: "/api/messageCenter",
    router: require("../module/messageCenter/router")
  },
  {
    path: "/api/overseaUser",
    router: require("../module/overseaUser/router")
  },
  {
    path: "/api/deskin",
    router: require("../module/deskin/router")
  },
  {
    path: "/api/developer",
    router: require("../module/developer/router")
  },
  {
    path: "/api/cloudDesk",
    router: require("../module/cloudDesk/router")
  },
  {
    path: "/api/approval",
    router: require("../module/approval/router")
  }
];
module.exports = {
  route
};
