/*!40101 SET NAMES utf8 */;
/*!40014 SET FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET SQL_NOTES=0 */;
DROP TABLE IF EXISTS ums_tag;
CREATE TABLE `ums_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` tinyint(4) DEFAULT NULL COMMENT '1资讯文章',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO ums_tag(id,tag_name,type,create_time) VALUES(2,'ToDesk技术前沿',1,'2022-06-22 17:27:45'),(3,'安全与合规实践',1,'2022-06-22 17:27:45'),(4,'行业应用与洞察',1,'2022-06-22 17:27:45'),(5,'实操教程指南',1,'2022-06-22 17:27:45'),(6,'ToDesk功能更新',1,'2022-06-26 07:29:57'),(7,'官方福利与公告',1,'2022-06-26 07:30:19');

CREATE TABLE `ums_tag_relation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag_id` int(11) NOT NULL,
  `rid` int(11) NOT NULL COMMENT '关联ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

ALTER TABLE `ums_cms_article` 
  ADD COLUMN is_hot tinyint NOT NULL DEFAULT '0' COMMENT '0默认，1热门' AFTER `release_type`;