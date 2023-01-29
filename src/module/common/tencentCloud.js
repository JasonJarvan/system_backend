const tencentcloud = require("tencentcloud-sdk-nodejs");
const SmsClient = tencentcloud.sms.v20210111.Client;
const secretId = "AKIDazA5j6C1asugCSR9bomVyC9oDLCqFSPG";
const secretKey = "dz5uTlmWzCUbS4RaT7VeXAYhaDahZBXe";
const sms_clientConfig = {
    credential: {
        secretId,
        secretKey,
    },
    region: "ap-beijing",
    profile: {
        httpProfile: {
            endpoint: "sms.tencentcloudapi.com",
        },
    },
};
const smsClient = new SmsClient(sms_clientConfig);

const CdnClient = tencentcloud.cdn.v20180606.Client;
const cdn_clientConfig = {
    credential: {
        secretId,
        secretKey,
    },
    region: "",
    profile: {
        httpProfile: {
            endpoint: "cdn.tencentcloudapi.com",
        },
    },
};
const cdnClient = new CdnClient(cdn_clientConfig);

module.exports = { smsClient, cdnClient };
