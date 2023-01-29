ALTER TABLE `center`.`tv_product` 
MODIFY COLUMN `params` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '可变参数（json字符串）' AFTER `vip_limits`;

ALTER TABLE `center`.`tv_product` 
ADD COLUMN `main_pic` varchar(255) NOT NULL COMMENT '主图' AFTER `params`;