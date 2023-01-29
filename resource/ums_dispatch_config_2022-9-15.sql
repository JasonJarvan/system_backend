ALTER TABLE
    ums_dispatch_config
ADD
    COLUMN union_key VARCHAR(100) default null COMMENT '聚合方案标识' AFTER dp_domain;

ALTER TABLE
    ums_dispatch_config
ADD
    COLUMN union_priority SMALLINT DEFAULT 5000 COMMENT '聚合优先级,1-9999,默认5000' AFTER union_key;