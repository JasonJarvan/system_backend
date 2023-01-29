const express = require("express");
let router = express.Router();
const { validateToken } = require("../middleware/token");
const {
  getbyUserid,
  getUserList,
  getMacList,
  getMacExtByMacID,
  getMachineList,
  getPlanList,
  getOrderList,
  getInvoiceList,
  getWechatUserList,
  getMainUserList,
  getChildUserList,
  getOemList,
  getIOSUserList,
  getControlledOrderList,
  getMachineAliasList,
  getProductList,
  getTryPlanList,
  editProduct,
  getbyProductId,
  editProductNameAndDesc,
  getProductVersionRecords,
  publishProduct,
  unpublishProduct,
  productTypeList,
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
} = require("./controller");

router.use(validateToken);
router.get("/users", getUserList);
router.get("/order", getOrderList);
router.get("/invoice", getInvoiceList);
router.get("/mac", getMacList);
router.get("/mac/ext/:id", getMacExtByMacID);
router.get("/mac/machine", getMachineList);
router.get("/users/:id", getbyUserid);
router.get("/plans", getPlanList);
router.get("/tryplans", getTryPlanList);
router.get("/wechatusers", getWechatUserList);
router.get("/child", getMainUserList);
router.get("/child/:id", getChildUserList);
router.get("/oem", getOemList);
router.get("/iosusers", getIOSUserList);
router.get("/ctrlOrder", getControlledOrderList);
router.get("/alias", getMachineAliasList);
router.get("/toc/productList", getProductList);
router.post("/toc/editProduct", editProduct);
router.get("/toc/product/:id", getbyProductId);
router.post("/toc/editProductNameAndDesc", editProductNameAndDesc);
router.get("/toc/productVersionRecords", getProductVersionRecords);
router.post("/toc/publishProduct", publishProduct);
router.post("/toc/unpublishProduct", unpublishProduct);
router.get("/toc/productTypeList", productTypeList);
router.get("/toc/someChooseOption", someChooseOption);
router.get("/searchUser", searchUser);
router.get("/searchUserDetail", searchUserDetail);
router.post("/newOrder/upgradeCode", sendUpgradeUserCode);
router.post("/newOrder/update", upgradeUser);
router.get("/newOrder", getNewOrder);
router.get("/newOrderCSV", getNewOrderCSV);
router.get("/newOrder/by/:id", getNewOrderByID);
router.get("/newOrderPayResult/by/:id", getNewOrderPayResultByID);
router.get("/newOrder/details/:id", getNewOrderDetailsByOrderID);
router.get("/newOrder/detail/:id", getNewOrderDetailByDetailID);
router.get("/newOrder/product", getNewProductForNewOrderFilter);
router.post("/newOrder/refundCode", sendRefundNewOrderCode);
router.post("/newOrder/refund", refundNewOrder);
router.get("/newProductSPU", getNewProductSPU);
router.get("/newProduct/:id", getNewProductsBySPUID);
router.get("/newProductDetail", getNewProductDetails);
router.get("/newProductDetail/:id", getNewProductDetailsByID);
router.post("/newProductDetail", updateNewProductDetail);
router.get("/newProductGray", getNewProductGrays);
router.get("/newProductGray/:id", getNewProductGrayByID);
router.post("/newProductGray", updateNewProductGray);
router.post("/newProductGraySync", syncNewProductGrayToFormal);
router.get("/BlackList", getBlackListSISMEMBER);
router.post("/BlackList", addBlackList);
router.delete("/BlackList", deleteBlackList);
router.post("/userphone/code", sendUserPhoneCode);
router.post("/userphone/update", updateUserPhone);
router.get("/md5", getMD5List);
router.get("/md5/:id", getMD5ByID);
router.delete("/md5/:id", deleteMD5);
router.post("/md5", updateMD5);
router.get("/cycleAgreement", getCycleAgreements);
router.get("/cycleAgreement/by/:id", getCycleAgreementByID);
router.get("/cycleAgreement/details/:id", getCycleAgreementDetailsByAgreementID);
router.get("/cycleAgreement/detail/:id", getCycleAgreementDetailByDetailID);
router.get("/GPUWhiteList", getGPUWhiteList);
router.get("/GPUWhiteList/:id", getGPUWhiteListByID);
router.delete("/GPUWhiteList/:id", deleteGPUWhiteList);
router.post("/GPUWhiteList", updateGPUWhiteList);
router.get("/GPUBlackList", getGPUBlackList);
router.get("/GPUBlackList/:id", getGPUBlackListByID);
router.delete("/GPUBlackList/:id", deleteGPUBlackList);
router.post("/GPUBlackList", updateGPUBlackList);
router.get("/NewCoupon", getNewCoupons);
router.get("/NewCoupon/:id", getNewCouponByID);
router.delete("/NewCoupon/:id", deleteNewCoupon);
router.post("/NewCoupon", updateNewCoupon);
router.get("/NewProductCombo", getNewProductCombos);
router.get("/NewProductCombo/:id", getNewProductComboByID);
router.delete("/NewProductCombo/:id", deleteNewProductCombo);
router.post("/NewProductCombo", updateNewProductCombo);
module.exports = router;
