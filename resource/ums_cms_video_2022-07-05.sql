# Host: 192.168.103.60:3307  (Version: 5.7.36-log)
# Date: 2022-07-05 15:05:18
# Generator: MySQL-Front 5.3  (Build 4.234)

/*!40101 SET NAMES utf8 */;

#
# Structure for table "ums_cms_video"
#

CREATE TABLE `ums_cms_video` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `name` varchar(100) DEFAULT NULL COMMENT '视频名称',
  `link` varchar(1000) DEFAULT NULL COMMENT '视频链接',
  `tag` varchar(100) DEFAULT NULL COMMENT '标签',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频管理表';
