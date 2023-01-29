if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: `../../env/.env.local` });
} else {
    require("dotenv").config({ path: `../../env/.env` });
}
const fs = require("fs")
const menu = require("./menuModel")
const menuGenerate = async (req, res) => {
    let initRoute = [
        {
            path: "/user",
            layout: false,
            routes: [
                {
                    path: "/user/login",
                    layout: false,
                    name: "login",
                    component: "./user/Login",
                },
                {
                    path: "/user",
                    redirect: "/user/login",
                },
                {
                    component: "404",
                },
            ],
        },
    ]

    let menus = await menu().getMenus()

    let tailRoute = [
        {
            path: "/",
            redirect: "/dashboard/analysis",
        }, {
            component: "404",
        },
    ]
    initRoute = [...initRoute, ...menus, ...tailRoute]
    let route= JSON.stringify(initRoute)
    fs.writeFile("routes.js", `export default ${route}`,  function(err) {
        if (err) {
            return console.error(err);
        }
        console.log("自动生成routes！");
     });
}



menuGenerate()