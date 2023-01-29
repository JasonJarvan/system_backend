let whiteList = ["/api/admin/login"]
let pre = ["/api"]
let admin = {
    route: [
        {
            path: "/dashboard",
            name: "dashboard",
            icon: "dashboard",
            routes: [
                {
                    name: "analysis",
                    icon: "smile",
                    path: "/dashboard/analysis",
                },  
            ],
        },
        {
            path: "/adminManager",
            name: "user",
            icon: "user",
            routes: [
                {
                    name: "adminManager",
                    icon: "user",
                    // icon doesn't work in child.
                    path: "/adminManager/manager",
                },
                {
                    name: "userManager",
                    path: "/adminManager/userManager",
                },
                {
                    name: "userPermission",
                    path: "/adminManager/userPermission",
                },
            ],
        },
        {
            path: "/configuration",
            name: "configuration",
            icon: "control",
            routes: [
                {
                    name: "systemConfig",
                    path: "/configuration/system",
                },
                {
                    name: "featureConfig",
                    path: "/configuration/feature",
                },
            ],
        },
        {
            path: "/RBAC",
            name: "roleBaseConfig",
            icon: "control",
            routes: [
                {
                    name: "menuManager",
                    path: "/RBAC/menuManager",

                },
            ],
        },],
    apiResource: [
        {
            method: "post",
            url: "/admin/*"
        },
        {
            method: "get",
            url: "/admin/*"
        },
        {
            method: "put",
            url: "/admin/*"
        },
        {
            method: "delete",
            url: "/admin/*"
        },
        {
            method: "post",
            url: "/user/*"
        },
        {
            method: "get",
            url: "/user/*"
        },
        {
            method: "put",
            url: "/user/*"
        },
        {
            method: "delete",
            url: "/user/*"
        },
        {
            method: "post",
            url: "/useconfigurationr/*"
        },
        {
            method: "get",
            url: "/useconfigurationr/*"
        },
        {
            method: "put",
            url: "/useconfigurationr/*"
        },
        {
            method: "delete",
            url: "/useconfigurationr/*"
        },
    ]

}

let abtest = {
    route: [],
    apiPermission: []
}
let graytest = {
    route: [],
    apiPermission: []
}

module.exports = {
    permit: {
        1:admin
    }, whiteList, pre
}