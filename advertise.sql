ALTER TABLE ums_dispatch_config MODIFY dp_concat varchar(500) COMMENT "关联分组";
ALTER TABLE ums_dispatch_config MODIFY dp_state int(4) DEFAULT '0' COMMENT "下发状态";
ALTER TABLE ums_dispatch_config MODIFY dp_delete int(4) DEFAULT '0' COMMENT "删除状态";
ALTER TABLE ums_dispatch_config DROP dp_admin;
ALTER TABLE ums_dispatch_config ADD dp_domain VARCHAR(30) COMMENT "管理域" AFTER dp_concat;
ALTER TABLE ums_dispatch_config ADD dp_startTime VARCHAR(20) COMMENT "开始时间" AFTER dp_domain;
ALTER TABLE ums_dispatch_config ADD dp_endTime VARCHAR(20) COMMENT "结束时间" AFTER dp_startTime;
