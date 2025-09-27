-- Active: 1757555622046@@127.0.0.1@3306@yiqi_brainstorm
-- 意启头脑风暴平台数据库结构
-- 创建时间: 2024-01-15
-- 字符集: utf8mb4
-- 存储引擎: InnoDB

-- 创建数据库
CREATE DATABASE IF NOT EXISTS yiqi_brainstorm 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE yiqi_brainstorm;

-- 1. 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密后)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    failed_login_attempts INT DEFAULT 0 COMMENT '登录失败次数',
    locked_until TIMESTAMP NULL COMMENT '账户锁定到期时间',
    INDEX idx_username (username),
    INDEX idx_last_login (last_login_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='用户表';

-- 2. AI代理表
CREATE TABLE agents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '代理ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '代理名称',
    role_type VARCHAR(50) NOT NULL COMMENT '角色类型(设计师/市场调研员/工程师等)',
    system_prompt TEXT NOT NULL COMMENT '系统提示词',
    ai_model VARCHAR(50) NOT NULL DEFAULT 'qwen-plus' COMMENT 'AI模型名称',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态(ACTIVE/INACTIVE/DELETED)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_role_type (role_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='AI代理表';

-- 3. 头脑风暴会话表
CREATE TABLE brainstorm_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title VARCHAR(200) NOT NULL COMMENT '会话标题',
    description TEXT COMMENT '会话描述',
    topic TEXT COMMENT '讨论主题',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' COMMENT '会话状态(CREATED/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED)',
    current_phase VARCHAR(30) COMMENT '当前阶段(IDEA_GENERATION/FEASIBILITY_ANALYSIS/CRITICISM_DISCUSSION)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_current_phase (current_phase),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='头脑风暴会话表';

-- 4. 会话代理关联表
CREATE TABLE session_agents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    session_id BIGINT NOT NULL COMMENT '会话ID',
    agent_id BIGINT NOT NULL COMMENT '代理ID',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '参与状态(ACTIVE/INACTIVE)',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE KEY uk_session_agent (session_id, agent_id),
    INDEX idx_session_id (session_id),
    INDEX idx_agent_id (agent_id)
) ENGINE=InnoDB COMMENT='会话代理关联表';

-- 5. 阶段表
CREATE TABLE phases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '阶段ID',
    session_id BIGINT NOT NULL COMMENT '会话ID',
    phase_type VARCHAR(30) NOT NULL COMMENT '阶段类型(IDEA_GENERATION/FEASIBILITY_ANALYSIS/CRITICISM_DISCUSSION)',
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' COMMENT '阶段状态(NOT_STARTED/IN_PROGRESS/WAITING_APPROVAL/APPROVED/REJECTED/COMPLETED)',
    summary TEXT COMMENT '阶段总结',
    started_at TIMESTAMP NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_phase_type (phase_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB COMMENT='阶段表';

-- 6. 代理响应表
CREATE TABLE agent_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '响应ID',
    phase_id BIGINT NOT NULL COMMENT '阶段ID',
    agent_id BIGINT NOT NULL COMMENT '代理ID',
    content TEXT NOT NULL COMMENT '响应内容',
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' COMMENT '响应状态(PENDING/COMPLETED/FAILED)',
    processing_time_ms INT COMMENT '处理时间(毫秒)',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_phase_id (phase_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='代理响应表';

-- 7. 报告表
CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '报告ID',
    session_id BIGINT NOT NULL COMMENT '会话ID',
    title VARCHAR(200) NOT NULL COMMENT '报告标题',
    content LONGTEXT NOT NULL COMMENT '报告内容(JSON格式)',
    status VARCHAR(20) NOT NULL DEFAULT 'GENERATED' COMMENT '报告状态(GENERATING/GENERATED/FAILED)',
    file_path VARCHAR(500) COMMENT 'PDF文件路径',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB COMMENT='报告表';

-- 8. 代理历史版本表 (用于保留代理配置的历史版本)
CREATE TABLE agent_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '版本ID',
    agent_id BIGINT NOT NULL COMMENT '代理ID',
    version_number INT NOT NULL COMMENT '版本号',
    name VARCHAR(100) NOT NULL COMMENT '代理名称',
    role_type VARCHAR(50) NOT NULL COMMENT '角色类型',
    system_prompt TEXT NOT NULL COMMENT '系统提示词',
    ai_model VARCHAR(50) NOT NULL COMMENT 'AI模型名称',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态(ACTIVE/INACTIVE/DELETED)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_agent_id (agent_id),
    INDEX idx_version_number (version_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='代理历史版本表';