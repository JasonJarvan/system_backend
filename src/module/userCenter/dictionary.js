const isVisibleDic = {
  desc: "是否对外可见",
  no: {
    value: 0,
    desc: "不可见"
  },
  yes: {
    value: 1,
    desc: "可见"
  }
};

const isTryAgreementDic = {
  desc: "试用是否要绑定合约",
  no: {
    value: 0,
    desc: "不可以"
  },
  yes: {
    value: 1,
    desc: "可以"
  }
};

const isUseCouponDic = {
  desc: "首购是否使用优惠券",
  no: {
    value: 0,
    desc: "不可以"
  },
  yes: {
    value: 1,
    desc: "可以"
  }
};

const renewIsUseCouponDic = {
  desc: "续费是否使用优惠券",
  no: {
    value: 0,
    desc: "不可以"
  },
  yes: {
    value: 1,
    desc: "可以"
  }
};

const productTypeDic = {
  package: {
    type: 1,
    desc: "套餐",
    details: [
      {
        level: 2,
        desc: "专业版"
      },
      {
        level: 3,
        desc: "团队版"
      },
      {
        level: 6,
        desc: "高性能版"
      }
    ]
  },
  plug: {
    type: 2,
    desc: "插件",
    details: []
  },
  channels: {
    type: 3,
    desc: "通道数",
    details: [
      {
        level: 1,
        desc: "通道数"
      }
    ]
  },
  controlledAndroid: {
    type: 4,
    desc: "安卓被控",
    details: [
      {
        level: 1,
        desc: "安卓被控"
      }
    ]
  }
};

const productTypeDic2 = {
  package: [
    { type: 1, level: 2, desc: "专业版" },
    { type: 1, level: 3, desc: "团队版" },
    { type: 1, level: 6, desc: "高性能版" }
  ],
  plugs: [
    { type: 3, level: 1, desc: "通道数" },
    { type: 4, level: 1, desc: "安卓被控" }
  ]
};

module.exports = {
  isVisibleDic,
  isTryAgreementDic,
  isUseCouponDic,
  renewIsUseCouponDic,
  productTypeDic,
  productTypeDic2
};
