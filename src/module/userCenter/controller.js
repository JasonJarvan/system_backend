const userModel = require("./userModel");
const redisService = require("../common/redis/sredis");
const { getListController,
  getController,
  updateListController,
  deleteListController,
  addListController
} = require("../common/controlHelper");
const logger = require("../common/logger/logger");
const errorMsg = require("../common/errorMessage");
const moment = require("moment");
const {
  isVisibleDic,
  isTryAgreementDic,
  isUseCouponDic,
  renewIsUseCouponDic,
  productTypeDic2
} = require("./dictionary");

const getUserList = async (req, res) => {
  try {
    let { limit, offset } = req.query;
    let current = limit && limit > 0 ? offset / limit : 1;
    let { list, total } = await userModel.getUserList(req);
    for (const user of list) {
      user.is_online = await redisService.checkUserOnlineStatus(user.id);
    }
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
    console.log(error);
    return res.status(500).json({ status: 500, errorMessage: error });
  }
};

const getbyUserid = async (req, res) => {
  const userid = parseInt(req.params.id);
  console.info(`getbyUserid, req.params = ${userid}`);
  try {
    let list = await redisService.getbyUserid(userid);
    if (!list) {
      res.status(404).json({ code: 404, errorMessage: "用户没有机器在线" });
      return;
    }
    return res.status(200).json({ code: 200, data: { list } });
  } catch (error) {
    return res.status(500).json({ code: 500, errorMessage: "server error" });
  }
};

const getbyProductId = async (req, res) => {
  const productId = parseInt(req.params.id);
  console.info(`getbyProductId, req.params = ${productId}`);
  try {
    // let list = await redisService.getbyUserid(userid);
    // if (!list) {
    //   res.status(404).json({ code: 404, errorMessage: "用户没有机器在线" });
    //   return;
    // }
    let product = await userModel.getbyProductId(productId);
    let { type, type_level, vip_limits } = product;
    product = await userModel.getLatestVersionProduct(
      type,
      type_level,
      vip_limits
    );
    if (product.params) {
      product.params = JSON.parse(product.params);
    }
    console.log("product:", product);
    return res.status(200).json({ code: 200, data: { product } });
  } catch (error) {
    return res.status(500).json({ code: 500, errorMessage: "server error" });
  }
};

const getProductVersionRecords = async (req, res) => {
  return await getListController(req, res, userModel.getProductVersionRecords);
};

const getMacList = (req, res) =>
  getListController(req, res, userModel.getMacList);
const getMacExtByMacID = (req, res) => getController(req, res, userModel.getMacExtByMacID);
const getMachineList = (req, res) =>
  getListController(req, res, userModel.getMachineList);
const getPlanList = (req, res) =>
  getListController(req, res, userModel.getPlanList);
const getTryPlanList = (req, res) =>
  getListController(req, res, userModel.getTryPlanList);
const getWechatUserList = (req, res) =>
  getListController(req, res, userModel.getWechatUserList);
const getOrderList = (req, res) =>
  getListController(req, res, userModel.getOrderList);
const getInvoiceList = (req, res) =>
  getListController(req, res, userModel.getInvoiceList);
const getMainUserList = (req, res) =>
  getListController(req, res, userModel.getMainUserList);
const getOemList = (req, res) =>
  getListController(req, res, userModel.getOemList);
const getIOSUserList = (req, res) =>
  getListController(req, res, userModel.getIOSUserList);
const getControlledOrderList = (req, res) =>
  getListController(req, res, userModel.getControlledOrderList);
const getMachineAliasList = (req, res) =>
  getListController(req, res, userModel.getMachineAliasList);
const getProductList = (req, res) =>
  getListController(req, res, userModel.getProductList);

const editProduct = async (req, res) => {
  const product = req.body;
  if (!product) {
    return res.status(400).json({
      status: 400,
      errorMessage: errorMsg("PRODUCT_INFOMATION_MISSING")
    });
  }
  console.log("product", product);
  try {
    if (product.id) {
      // 存在id，代表编辑原产品
      let oldproduct = await userModel.getbyProductId(product.id);
      let { type, type_level, vip_limits } = oldproduct;
      oldproduct = await userModel.getLatestVersionProduct(
        type,
        type_level,
        vip_limits
      );
      product.params = JSON.stringify(product.params);
      product.type = oldproduct.type;
      product.type_level = oldproduct.type_level;
      product.vip_limits = oldproduct.vip_limits;
      product.is_visible = isVisibleDic.no.value;
      product.version = oldproduct.version + 1;
      // console.log(moment(product.create_time).unix());
      console.log(moment(product.create_time).format("YYYY-MM-DD HH:mm:ss"));
      product.create_time = moment(product.create_time).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      delete product.id;
      delete product.update_time;
    } else {
      // 不存在id，代表新增一个产品
      product.version = 1;
      product.is_visible = isVisibleDic.no.value;
      product.params = JSON.stringify(product.params);
    }
    await userModel.insertProduct({
      ...product
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("product", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const publishProduct = async (req, res) => {
  const { id, is_visible } = req.body;
  if (!id) {
    return res.status(400).json({
      status: 400,
      errorMessage: errorMsg("ID_INFOMATION_MISSING")
    });
  }
  try {
    let oldproduct = await userModel.getbyProductId(id);
    let { type, type_level, vip_limits } = oldproduct;
    const product = await userModel.getLatestVersionProduct(
      type,
      type_level,
      vip_limits
    );

    product.is_visible = is_visible;
    product.version++;
    // console.log(moment(product.create_time).unix());
    console.log(moment(product.create_time).format("YYYY-MM-DD HH:mm:ss"));
    product.create_time = moment(product.create_time).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    delete product.id;
    delete product.update_time;

    let result = await userModel.insertProduct({
      ...product
    });

    let insertResult = await userModel.getbyProductId(result.insertId);
    console.log("insertResult:", insertResult);
    await userModel.insertPublishProduct({
      ...insertResult
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("product", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const unpublishProduct = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({
      status: 400,
      errorMessage: errorMsg("ID_INFOMATION_MISSING")
    });
  }
  // console.log("product", product);
  try {
    let oldproduct = await userModel.getbyProductId(id);
    let { type, type_level, vip_limits } = oldproduct;
    const product = await userModel.getLatestVersionProduct(
      type,
      type_level,
      vip_limits
    );

    product.is_visible = isVisibleDic.no.value;
    product.version++;

    console.log(moment(product.create_time).format("YYYY-MM-DD HH:mm:ss"));
    product.create_time = moment(product.create_time).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    delete product.id;
    delete product.update_time;
    await userModel.insertProduct({
      ...product
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("product", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const editProductNameAndDesc = async (req, res) => {
  const { id, name, desc } = req.body;
  if (!name || !desc || !id) {
    return res.status(400).json({
      status: 400,
      errorMessage: errorMsg("NAME_OR_DESC_OR_ID_INFOMATION_MISSING")
    });
  }
  console.log("name:", name);
  console.log("desc:", desc);
  try {
    let product = await userModel.getbyProductId(id);
    let { type, type_level, vip_limits } = product;
    product = await userModel.getLatestVersionProduct(
      type,
      type_level,
      vip_limits
    );

    product.name = name;
    product.desc = desc;
    product.is_visible = isVisibleDic.no.value;
    product.version++;

    product.create_time = moment(product.create_time).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    delete product.id;
    delete product.update_time;

    await userModel.insertProduct({
      ...product
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("product", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const editProductNameAndDescAndPublish = async (req, res) => {
  const { id, name, desc } = req.body;
  if (!name || !desc || !id) {
    return res.status(400).json({
      status: 400,
      errorMessage: errorMsg("NAME_OR_DESC_OR_ID_INFOMATION_MISSING")
    });
  }
  try {
    let product = await userModel.getbyProductId(id);
    let { type, type_level, vip_limits } = product;
    product = await userModel.getLatestVersionProduct(
      type,
      type_level,
      vip_limits
    );

    product.name = name;
    product.desc = desc;
    product.is_visible = isVisibleDic.yes.value;
    product.version++;

    product.create_time = moment(product.create_time).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    delete product.id;
    delete product.update_time;

    await userModel.insertProduct({
      ...product
    });
    return res.status(200).json({ status: 200, errorMessage: `successful` });
  } catch (err) {
    logger.insert("product", "error", err.message);
    return res.status(500).json({ status: 500, errorMessage: err.message });
  }
};

const productTypeList = async (req, res) => {
  console.log("productTypeDic2:", productTypeDic2);
  // return productTypeDic;
  let pkg = productTypeDic2.package;
  for (let i = 0; i < pkg.length; i++) {
    let product = await userModel.getLatestVersionProduct(
      pkg[i].type,
      pkg[i].level,
      0
    );
    console.log("product:", product);
    pkg[i].used = product ? 1 : 0;
  }

  let plugs = productTypeDic2.plugs;
  for (let i = 0; i < plugs.length; i++) {
    let userdArray = [];
    for (let j = 0; j < pkg.length; j++) {
      let product = await userModel.getLatestVersionProduct(
        plugs[i].type,
        plugs[i].level,
        pkg[j].level
      );
      console.log("product:", product);
      if (product) {
        userdArray.push(pkg[j].level);
      }
    }
    plugs[i].used = userdArray;
  }
  let data = productTypeDic2;
  return res.status(200).json({ code: 200, data });
};

const isVisible = async (req, res) => {
  let isVisible = [];
  isVisible.push(isVisibleDic.no);
  isVisible.push(isVisibleDic.yes);
  return res.status(200).json({ code: 200, data: { isVisible } });
};

const isTryAgreement = async (req, res) => {
  let isTryAgreement = [];
  isTryAgreement.push(isTryAgreementDic.no);
  isTryAgreement.push(isTryAgreementDic.yes);
  return res.status(200).json({ code: 200, data: { isTryAgreement } });
};

const isUseCoupon = async (req, res) => {
  let isUseCoupon = [];
  isUseCoupon.push(isUseCouponDic.no);
  isUseCoupon.push(isUseCouponDic.yes);
  return res.status(200).json({ code: 200, data: { isUseCoupon } });
};

const renewIsUseCoupon = async (req, res) => {
  let renewIsUseCoupon = [];
  renewIsUseCoupon.push(renewIsUseCouponDic.no);
  renewIsUseCoupon.push(renewIsUseCouponDic.yes);
  return res.status(200).json({ code: 200, data: { renewIsUseCoupon } });
};

const someChooseOption = async (req, res) => {
  let someChooseOption = {
    isTryAgreementDic,
    isUseCouponDic,
    renewIsUseCouponDic
  };

  return res.status(200).json({ code: 200, data: { someChooseOption } });
};

const getChildUserList = async (req, res) => {
  let userid = parseInt(req.params.id);
  console.info(`getChildUserid, req.params = ${userid}`);
  try {
    let { list, total } = await userModel.getChildUserList(userid);
    if (total == 0) {
      res.status(404).json({ code: 404, errorMessage: "用户没有子账户" });
      return;
    }
    return res.status(200).json({ code: 200, data: { list } });
  } catch (error) {
    return res.status(500).json({ code: 500, errorMessage: "server error" });
  }
};

const searchUser = async (req, res) => {
  return userModel
    .searchUser(req.query)
    .then((data) => {
      return res.status(200).json({
        code: 200,
        data: data
      });
    })
    .catch((err) => {
      return res.status(500).json({
        code: 500,
        error: err.message
      });
    });
};
const searchUserDetail = async (req, res) => {
  return userModel
    .searchUserDetail(req.query)
    .then((data) => {
      return res.status(200).json({
        code: 200,
        data: data
      });
    })
    .catch((err) => {
      return res.status(500).json({
        code: 500,
        error: err.message
      });
    });
};
const sendUpgradeUserCode = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.sendUpgradeUserCode });
const upgradeUser = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.upgradeUser });


const getNewOrder = (req, res) => getListController(req, res, userModel.getNewOrder);
const getNewOrderCSV = (req, res) => getListController(req, res, userModel.getNewOrderCSV);
const getNewOrderByID = (req, res) => getController(req, res, userModel.getNewOrderByID);
const getNewOrderPayResultByID = (req, res) => getController(req, res, userModel.getNewOrderPayResultByID);
const getNewOrderDetailsByOrderID = (req, res) => getController(req, res, userModel.getNewOrderDetailsByOrderID);
const getNewOrderDetailByDetailID = (req, res) => getController(req, res, userModel.getNewOrderDetailByDetailID);
const getNewProductForNewOrderFilter = (req, res) => getController(req, res, userModel.getNewProductForNewOrderFilter);
const sendRefundNewOrderCode = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.sendRefundNewOrderCode });
const refundNewOrder = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.refundNewOrder });
const getNewProductSPU = (req, res) => getListController(req, res, userModel.getNewProductSPU);
const getNewProductsBySPUID = (req, res) => getController(req, res, userModel.getNewProductsBySPUID);

const getNewProductDetails = (req, res) => getListController(req, res, userModel.getNewProductDetails);
const getNewProductDetailsByID = (req, res) => getController(req, res, userModel.getNewProductDetailsByID);
const updateNewProductDetail = (req, res) => updateListController(req, res, { modelFunc: userModel.updateNewProductDetail });
const syncNewProductGrayToFormal = (req, res) => updateListController(req, res, { modelFunc: userModel.syncNewProductGrayToFormal });

const getNewProductGrays = (req, res) => getListController(req, res, userModel.getNewProductGrays);
const getNewProductGrayByID = (req, res) => getController(req, res, userModel.getNewProductGrayByID);
const updateNewProductGray = (req, res) => updateListController(req, res, { modelFunc: userModel.updateNewProductGray });

const getBlackListSISMEMBER = (req, res) => getController(req, res, userModel.getBlackListSISMEMBER);
const addBlackList = (req, res) => addListController(req, res, { modelFunc: userModel.addBlackList });
const deleteBlackList = async (req, res) => {
  try {
    const msg = await userModel.deleteBlackList(req);
    return res
      .status(200)
      .json({ code: 200, errorMessage: "Successful deleted" + msg });
  } catch (error) {
    console.error("deleteBlackList Error: ", error);
    return res.status(500).json({ status: 500, errorMessage: error.message });
  }
};
const sendUserPhoneCode = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.sendUserPhoneCode });
const updateUserPhone = (req, res) =>
  updateListController(req, res, { modelFunc: userModel.updateUserPhone });

const getMD5List = (req, res) => getListController(req, res, userModel.getMD5List);
const getMD5ByID = (req, res) => getController(req, res, userModel.getMD5ByID);
const deleteMD5 = (req, res) => deleteListController(req, res, { modelFunc: userModel.deleteMD5 });
const updateMD5 = (req, res) => updateListController(req, res, { modelFunc: userModel.updateMD5 });

const getCycleAgreements = (req, res) => getListController(req, res, userModel.getCycleAgreements);
const getCycleAgreementByID = (req, res) => getController(req, res, userModel.getCycleAgreementByID);
const getCycleAgreementDetailsByAgreementID = (req, res) => getController(req, res, userModel.getCycleAgreementDetailsByAgreementID);
const getCycleAgreementDetailByDetailID = (req, res) => getController(req, res, userModel.getCycleAgreementDetailByDetailID);

const getGPUWhiteList = (req, res) => getListController(req, res, userModel.getGPUWhiteList);
const getGPUWhiteListByID = (req, res) => getController(req, res, userModel.getGPUWhiteListByID);
const deleteGPUWhiteList = (req, res) => deleteListController(req, res, { modelFunc: userModel.deleteGPUWhiteList });
const updateGPUWhiteList = (req, res) => updateListController(req, res, { modelFunc: userModel.updateGPUWhiteList });

const getGPUBlackList = (req, res) => getListController(req, res, userModel.getGPUBlackList);
const getGPUBlackListByID = (req, res) => getController(req, res, userModel.getGPUBlackListByID);
const deleteGPUBlackList = (req, res) => deleteListController(req, res, { modelFunc: userModel.deleteGPUBlackList });
const updateGPUBlackList = (req, res) => updateListController(req, res, { modelFunc: userModel.updateGPUBlackList });

const getNewCoupons = (req, res) => getListController(req, res, userModel.getNewCoupons);
const getNewCouponByID = (req, res) => getController(req, res, userModel.getNewCouponByID);
const deleteNewCoupon = (req, res) => deleteListController(req, res, { modelFunc: userModel.deleteNewCoupon });
const updateNewCoupon = (req, res) => updateListController(req, res, { modelFunc: userModel.updateNewCoupon });

const getNewProductCombos = (req, res) => getListController(req, res, userModel.getNewProductCombos);
const getNewProductComboByID = (req, res) => getController(req, res, userModel.getNewProductComboByID);
const deleteNewProductCombo = (req, res) => deleteListController(req, res, { modelFunc: userModel.deleteNewProductCombo });
const updateNewProductCombo = (req, res) => updateListController(req, res, { modelFunc: userModel.updateNewProductCombo });

module.exports = {
  getUserList,
  getbyUserid,
  getMacList,
  getMacExtByMacID,
  getMachineList,
  getPlanList,
  getTryPlanList,
  getWechatUserList,
  getOrderList,
  getInvoiceList,
  getMainUserList,
  getChildUserList,
  getOemList,
  getIOSUserList,
  getControlledOrderList,
  getMachineAliasList,
  getProductList,
  editProduct,
  getbyProductId,
  editProductNameAndDesc,
  editProductNameAndDescAndPublish,
  getProductVersionRecords,
  publishProduct,
  unpublishProduct,
  productTypeList,
  isVisible,
  isTryAgreement,
  isUseCoupon,
  renewIsUseCoupon,
  someChooseOption,
  searchUser,
  searchUserDetail,
  sendUpgradeUserCode,
  upgradeUser,
  getNewOrder,
  getNewOrderCSV,
  getNewOrderByID,
  getNewOrderPayResultByID,
  getNewOrderDetailsByOrderID,
  getNewOrderDetailByDetailID,
  getNewProductForNewOrderFilter,
  sendRefundNewOrderCode,
  refundNewOrder,
  getNewProductSPU,
  getNewProductsBySPUID,
  getNewProductDetails,
  getNewProductDetailsByID,
  updateNewProductDetail,
  getNewProductGrays,
  getNewProductGrayByID,
  updateNewProductGray,
  syncNewProductGrayToFormal,
  getBlackListSISMEMBER,
  addBlackList,
  deleteBlackList,
  sendUserPhoneCode,
  updateUserPhone,
  getMD5List,
  getMD5ByID,
  deleteMD5,
  updateMD5,
  getCycleAgreements,
  getCycleAgreementByID,
  getCycleAgreementDetailsByAgreementID,
  getCycleAgreementDetailByDetailID,
  getGPUWhiteList,
  getGPUWhiteListByID,
  deleteGPUWhiteList,
  updateGPUWhiteList,
  getGPUBlackList,
  getGPUBlackListByID,
  deleteGPUBlackList,
  updateGPUBlackList,
  getNewCoupons,
  getNewCouponByID,
  deleteNewCoupon,
  updateNewCoupon,
  getNewProductCombos,
  getNewProductComboByID,
  deleteNewProductCombo,
  updateNewProductCombo,
};
