CREATE TABLE `ums_dispatchconfig_admin_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `dispatch_id` bigint(20) DEFAULT NULL,
  `admin_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dispatch_id` (`dispatch_id`,`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COMMENT='后台下发方案与管理员关系表'