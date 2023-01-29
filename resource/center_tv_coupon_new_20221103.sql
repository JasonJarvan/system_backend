-- Active: 1648555660284@@192.168.103.60@3307@center

CREATE TABLE
    `tv_coupon_new` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `info` varchar(25) NOT NULL COMMENT '名称',
        `pcode` varchar(15) NOT NULL COMMENT '优惠码',
        `cycle_type` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0连续订阅 1非连续订阅',
        `product_ids` varchar(5000) DEFAULT NULL COMMENT '不填代表全部产品，否则是选定产品，例：101,102',
        `coupon_type` tinyint(4) NOT NULL DEFAULT '1' COMMENT '1价格满减 2价格折扣 3数量满减 4数量折扣',
        `salelimit` int(11) NOT NULL COMMENT '满多少,满减以分为单位,折扣为百分比',
        `sale` int(11) NOT NULL COMMENT '减多少,满减以分为单位,折扣为百分比',
        `rule` varchar(1000) DEFAULT NULL COMMENT '自定义计算规则',
        `total_limit_times` int(11) NOT NULL DEFAULT '0' COMMENT '使用次数,保留值1000000无限使用',
        `user_limit_times` int(11) NOT NULL DEFAULT '0' COMMENT '单用户限量,保留值1000000无限使用',
        `user_whitelist` varchar(5000) DEFAULT NULL COMMENT '不填代表全部用户，否则是选定用户，例：101,102',
        `start_time` int(11) NOT NULL COMMENT '生效时间',
        `end_time` int(11) NOT NULL COMMENT '结束时间',
        `is_deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0未禁用 1已禁用',
        `creator_id` int(11) DEFAULT NULL COMMENT '操作人ID',
        `last_operator_id` int(11) DEFAULT NULL COMMENT '最后操作人ID',
        `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `info` (`info`),
        UNIQUE KEY `pcode` (`pcode`),
    ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8