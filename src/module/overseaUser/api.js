const axios = require("axios");
const FormData = require("form-data");
const overseaDomain =  process.env.OVERSEA_DOMAIN;

const getOverseaUsers = (req) => {
    let data = new FormData();
    data.append("key", "eb14bdffa53a21d6e60bec826fd2659f");
    data.append("limit", req.query.limit || 20);
    data.append("page", req.query.offset || 1);
    const config = {
        method: "post",
        url: `${overseaDomain}/stat/users`,
        headers: {
            ...data.getHeaders()
        },
        data: data
    };
    return axios(config).then((response) => {
        if (response.data.code == 200) {
            return response.data.data;
        } else {
            throw response.data
        }
    })
}

module.exports = {
    getOverseaUsers
}
