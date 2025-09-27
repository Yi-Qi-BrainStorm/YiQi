-- 数据库迁移脚本
-- 用于更新现有数据库结构以支持会话管理功能
-- 执行时间: 2024-01-15

USE yiqi_brainstorm;

-- 1. 更新 session_agents 表，添加 last_active_at 字段
ALTER TABLE session_agents 
ADD COLUMN last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活跃时间' AFTER joined_at;

-- 为 last_active_at 字段添加索引
ALTER TABLE session_agents 
ADD INDEX idx_last_active_at (last_active_at);

-- 更新 session_agents 表的 status 字段注释，支持 DELETED 状态
ALTER TABLE session_agents 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '参与状态(ACTIVE/INACTIVE/DELETED)';

-- 2. 更新 phases 表，添加 updated_at 字段
ALTER TABLE phases 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER created_at;

-- 为 updated_at 字段添加索引
ALTER TABLE phases 
ADD INDEX idx_updated_at (updated_at);

-- 3. 更新 agent_responses 表结构
-- 修改 content 字段为可空（因为处理中的响应可能还没有内容）
ALTER TABLE agent_responses 
MODIFY COLUMN content TEXT COMMENT '响应内容';

-- 修改 status 字段的默认值和注释
ALTER TABLE agent_responses 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING' COMMENT '响应状态(PROCESSING/SUCCESS/FAILED/TIMEOUT)';

-- 重命名 processing_time_ms 字段为 response_time_ms
ALTER TABLE agent_responses 
CHANGE COLUMN processing_time_ms response_time_ms BIGINT COMMENT '响应时间(毫秒)';

-- 添加 updated_at 字段
ALTER TABLE agent_responses 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER created_at;

-- 4. 确保所有现有的 session_agents 记录都有 last_active_at 值
UPDATE session_agents 
SET last_active_at = joined_at 
WHERE last_active_at IS NULL;

-- 5. 确保所有现有的 phases 记录都有 updated_at 值
UPDATE phases 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 6. 确保所有现有的 agent_responses 记录都有 updated_at 值
UPDATE agent_responses 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 验证迁移结果
SELECT 'Migration completed successfully' as status;

-- 显示更新后的表结构
SHOW CREATE TABLE session_agents;
SHOW CREATE TABLE phases;
SHOW CREATE TABLE agent_responses;