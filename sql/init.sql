SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for ums_admin
-- ----------------------------
DROP TABLE IF EXISTS `ums_admin`;

CREATE TABLE `ums_admin` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `username` varchar(64) DEFAULT NULL,
    `password` varchar(64) DEFAULT NULL,
    `icon` varchar(500) DEFAULT NULL COMMENT '头像',
    `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
    `nick_name` varchar(200) DEFAULT NULL COMMENT '昵称',
    `note` varchar(500) DEFAULT NULL COMMENT '备注信息',
    `create_time` datetime DEFAULT NULL COMMENT '创建时间',
    `login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
    `status` int(1) DEFAULT '1' COMMENT '帐号启用状态：0->禁用；1->启用',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8 COMMENT = '后台用户表';

-- ----------------------------
-- Table structure for ums_admin_login_log
-- ----------------------------
DROP TABLE IF EXISTS `ums_admin_login_log`;

CREATE TABLE `ums_admin_login_log` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `admin_id` bigint(20) DEFAULT NULL,
    `create_time` datetime DEFAULT NULL,
    `ip` varchar(64) DEFAULT NULL,
    `address` varchar(100) DEFAULT NULL,
    `user_agent` varchar(100) DEFAULT NULL COMMENT '浏览器登录类型',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 204 DEFAULT CHARSET = utf8 COMMENT = '后台用户登录日志表';

-- ----------------------------
-- Table structure for ums_admin_permission_relation
-- ----------------------------
DROP TABLE IF EXISTS `ums_admin_permission_relation`;

CREATE TABLE `ums_admin_permission_relation` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `admin_id` bigint(20) DEFAULT NULL,
    `permission_id` bigint(20) DEFAULT NULL,
    `type` int(1) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = '后台用户和权限关系表(除角色中定义的权限以外的加减权限)';

-- ----------------------------
-- Records of ums_admin_permission_relation
-- ----------------------------
-- ----------------------------
-- Table structure for ums_admin_role_relation
-- ----------------------------
DROP TABLE IF EXISTS `ums_admin_role_relation`;

CREATE TABLE `ums_admin_role_relation` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `admin_id` bigint(20) DEFAULT NULL,
    `role_id` bigint(20) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 31 DEFAULT CHARSET = utf8 COMMENT = '后台用户和角色关系表';

-- ----------------------------
-- Table structure for ums_permission
-- ----------------------------
DROP TABLE IF EXISTS `ums_permission`;

CREATE TABLE `ums_permission` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `pid` bigint(20) DEFAULT NULL COMMENT '父级权限id',
    `name` varchar(100) DEFAULT NULL COMMENT '名称',
    `value` varchar(200) DEFAULT NULL COMMENT '权限值',
    `icon` varchar(500) DEFAULT NULL COMMENT '图标',
    `type` int(1) DEFAULT NULL COMMENT '权限类型：0->目录；1->菜单；2->按钮（接口绑定权限）',
    `path` varchar(200) DEFAULT NULL COMMENT '前端资源路径',
    `status` int(1) DEFAULT NULL COMMENT '启用状态；0->禁用；1->启用',
    `create_time` datetime DEFAULT NULL COMMENT '创建时间',
    `sort` int(11) DEFAULT NULL COMMENT '排序',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8 COMMENT = '后台用户权限表';

-- ----------------------------
-- Table structure for ums_resource
-- ----------------------------
DROP TABLE IF EXISTS `ums_resource`;

CREATE TABLE `ums_resource` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `create_time` datetime DEFAULT NULL COMMENT '创建时间',
    `name` varchar(200) DEFAULT NULL COMMENT '资源名称',
    `method` varchar(200) DEFAULT NULL COMMENT '请求方法GET/PUT/POST/DELETE',
    `url` varchar(200) DEFAULT NULL COMMENT '资源URL',
    `description` varchar(500) DEFAULT NULL COMMENT '描述',
    `category_id` bigint(20) DEFAULT NULL COMMENT '资源分类ID',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 31 DEFAULT CHARSET = utf8 COMMENT = '后台资源表';

-- ----------------------------
-- Table structure for ums_resource_category
-- ----------------------------
DROP TABLE IF EXISTS `ums_resource_category`;

CREATE TABLE `ums_resource_category` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `create_time` datetime DEFAULT NULL COMMENT '创建时间',
    `name` varchar(200) DEFAULT NULL COMMENT '分类名称',
    `sort` int(4) DEFAULT NULL COMMENT '排序',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8 COMMENT = '资源分类表';

-- ----------------------------
-- Table structure for ums_role
-- ----------------------------
DROP TABLE IF EXISTS `ums_role`;

CREATE TABLE `ums_role` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) DEFAULT NULL COMMENT '名称',
    `description` varchar(500) DEFAULT NULL COMMENT '描述',
    `admin_count` int(11) DEFAULT NULL COMMENT '后台用户数量',
    `create_time` datetime DEFAULT NULL COMMENT '创建时间',
    `status` int(1) DEFAULT '1' COMMENT '启用状态：0->禁用；1->启用',
    `sort` int(11) DEFAULT '0',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8 COMMENT = '后台用户角色表';

-- ----------------------------
-- Table structure for ums_role_menu_relation
-- ----------------------------
DROP TABLE IF EXISTS `ums_role_menu_relation`;

CREATE TABLE `ums_role_menu_relation` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
    `menu_id` bigint(20) DEFAULT NULL COMMENT '菜单ID',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 96 DEFAULT CHARSET = utf8 COMMENT = '后台角色菜单关系表';

-- ----------------------------
-- Table structure for ums_role_permission_relation
-- ----------------------------
DROP TABLE IF EXISTS `ums_role_permission_relation`;

CREATE TABLE `ums_role_permission_relation` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `role_id` bigint(20) DEFAULT NULL,
    `permission_id` bigint(20) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 18 DEFAULT CHARSET = utf8 COMMENT = '后台用户角色和权限关系表';

-- ----------------------------
-- Table structure for ums_role_resource_relation
-- ----------------------------
DROP TABLE IF EXISTS `ums_role_resource_relation`;

CREATE TABLE `ums_role_resource_relation` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
    `resource_id` bigint(20) DEFAULT NULL COMMENT '资源ID',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 178 DEFAULT CHARSET = utf8 COMMENT = '后台角色资源关系表';

-- ----------------------------
-- Table structure for ums_configuration
-- ----------------------------
DROP TABLE IF EXISTS `ums_configuration`;

CREATE TABLE `ums_configuration` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `config_name` varchar(100) NOT NULL COMMENT '配置名称',
  `config_value` varchar(100) NOT NULL COMMENT '配置值',
  `config_desc` varchar(100) NOT NULL COMMENT '配置描述',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET=utf8 COMMENT='配置中心键值表';

INSERT INTO `ums_configuration` (`id`, `config_name`, `config_value`, `config_desc`) VALUES
(1, 'current_version', '1.0.0', '当前版本号'),
(2, 'allow_register', 'true', '开放注册功能'),
(3, 'allow_login', 'true', '开放登录功能'),
(4, 'user_login_max_failure_count', '5', '用户登录最大错误次数'),
(5, 'default_transit_server', 'dummy server', '默认中转服务器');

-- ----------------------------
-- Table structure for ums_abtest_version
-- ----------------------------
DROP TABLE IF EXISTS `ums_abtest_version`;
CREATE TABLE `ums_abtest_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` int(1) NOT NULL COMMENT '客户端平台(0Windows 1MacOS 2Linux 3iOS 4Android 5Lite)',
  `version_number` varchar(45) NOT NULL COMMENT '版本号',
  `version_update_log` varchar(200) DEFAULT NULL COMMENT '版本更新日志',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `release_status` int(1) DEFAULT '0' COMMENT '正式发布状态(0未发布 1已发布)',
  `release_time` datetime DEFAULT NULL COMMENT '正式发布时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='灰度版本';

-- ----------------------------
-- Table structure for ums_abtest_gray
-- ----------------------------
DROP TABLE IF EXISTS `ums_abtest_gray`;
CREATE TABLE `ums_abtest_gray` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version_id` int(11) NOT NULL COMMENT '版本号ID',
  `name` varchar(100) DEFAULT NULL COMMENT '灰度名称',
  `start_time` datetime DEFAULT NULL COMMENT '灰度开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '灰度结束时间',
  `program_path` varchar(500) DEFAULT NULL COMMENT '灰度包路径',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='灰度发布';

-- ----------------------------
-- Table structure for ums_abtest_strategy
-- ----------------------------
DROP TABLE IF EXISTS `ums_abtest_strategy`;
CREATE TABLE `ums_abtest_strategy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gray_id` int(11) NOT NULL COMMENT '灰度ID',
  `relation` int(11) NOT NULL DEFAULT '0' COMMENT '关系(0默认策略 1并且 2或者)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `type` int(1) DEFAULT NULL COMMENT '策略类型(0按比例随机发布 1按地域灰度发布 2按发布渠道灰度发布 3:按版本号灰度发布)',
  `value` varchar(200) DEFAULT NULL COMMENT '策略值',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='灰度策略';


-- ----------------------------
-- Table structure for ums_cms_links
-- ----------------------------
DROP TABLE IF EXISTS `ums_cms_links`;
CREATE TABLE `ums_cms_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL COMMENT '名称',
  `url` varchar(400) DEFAULT NULL COMMENT '链接',
  `sort` int(11) DEFAULT NULL COMMENT '顺序',
  `status` int(1) DEFAULT '0' COMMENT '状态（0正常，1停用）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='友情链接';

-- ----------------------------
-- Table structure for ums_cms_article
-- ----------------------------
DROP TABLE IF EXISTS `ums_cms_article`;
CREATE TABLE `ums_cms_article` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `article_title` varchar(128) NOT NULL DEFAULT '' COMMENT '文章标题',
  `sub_title` varchar(200) DEFAULT '' COMMENT '副标题',
  `info_sources` varchar(128) DEFAULT '' COMMENT '资讯来源',
  `info_introduction` varchar(480) DEFAULT '' COMMENT '资讯简介',
  `info_content` text COMMENT '资讯详情',
  `browse_count` int(8) NOT NULL DEFAULT '0' COMMENT '浏览次数',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `release_time` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `release_admin` int(11) DEFAULT NULL COMMENT '发布管理员id',
  `is_release` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否发布 0未发布 1已发布',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;


CREATE TABLE `ums_user_count` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `online` int(10) NOT NULL COMMENT '在线总数',
  `newtd` int(10) NOT NULL COMMENT '新设备数',
  `srctd` int(10) NOT NULL COMMENT '控端数',
  `dsttd` int(10) NOT NULL COMMENT '被控数',
  `total_count` int(10) NOT NULL COMMENT '用户总数',
  `total_vip_count` int(10) NOT NULL COMMENT '付费用户总数',
  `last_day_count` int(10) NOT NULL COMMENT '昨日新增数',
  `last_week_count` int(10) NOT NULL COMMENT '过去7天新增数',
  `last_month_count` int(10) NOT NULL COMMENT '过去30天新增数',
  `date` int(11) NOT NULL COMMENT '时间戳',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;


