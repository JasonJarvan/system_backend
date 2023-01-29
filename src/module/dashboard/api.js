const axios = require("axios");
const FormData = require("form-data");
const overseaDomain =  process.env.OVERSEA_DOMAIN;

const getOverseaAnalysis = () => {
    let data = new FormData();
    data.append("key", "eb14bdffa53a21d6e60bec826fd2659f");
    var config = {
        method: "post",
        url: `${overseaDomain}/stat/index`,
        headers: {
            ...data.getHeaders()
        },
        data: data
    };
    return axios(config).then((response) => {
        if(response.data.code == 200){
            return response.data.data;
        } else {
            throw response.data
        }
    })
}

module.exports = {
    getOverseaAnalysis
}
