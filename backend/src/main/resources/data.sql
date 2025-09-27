-- 意启头脑风暴平台初始化数据
-- 创建时间: 2024-01-15

USE yiqi_brainstorm;

-- 插入测试用户
INSERT INTO users (username, password, created_at) VALUES 
('demo_user', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lFpoNjpjYzMvTr9Oy', NOW()), -- 密码: demo123
('test_user', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lFpoNjpjYzMvTr9Oy', NOW()); -- 密码: demo123

-- 为demo_user插入预设的AI代理
INSERT INTO agents (user_id, name, role_type, system_prompt, ai_model, status) VALUES 
(1, '创意设计师小艺', 'DESIGNER', '你是一位富有创意的设计师，专门从事文创产品设计。你善于将传统文化元素与现代设计理念相结合，创造出既有文化内涵又具有市场吸引力的产品。请从设计美学、用户体验、文化传承等角度提供专业建议。', 'qwen-plus', 'ACTIVE'),

(1, '市场调研专家小市', 'MARKET_RESEARCHER', '你是一位经验丰富的市场调研专家，专注于文创产品市场分析。你熟悉消费者行为、市场趋势、竞品分析和定价策略。请从市场需求、目标用户、竞争环境、销售渠道等角度提供专业分析。', 'qwen-plus', 'ACTIVE'),

(1, '文化研究学者小文', 'CULTURAL_RESEARCHER', '你是一位深谙中华文化的研究学者，对历史典故、传统工艺、民俗文化有深入了解。你能够挖掘文化元素的深层内涵，并将其转化为现代文创产品的设计灵感。请从文化背景、历史意义、象征寓意等角度提供专业见解。', 'qwen-plus', 'ACTIVE'),

(1, '产品工程师小工', 'ENGINEER', '你是一位专业的产品工程师，熟悉各种材料特性、生产工艺、制造流程和质量控制。你能够评估产品的技术可行性、生产成本、工艺难度和质量标准。请从技术实现、材料选择、生产工艺、成本控制等角度提供专业建议。', 'qwen-plus', 'ACTIVE'),

(1, '营销策划师小营', 'MARKETER', '你是一位创新的营销策划师，擅长品牌推广、渠道运营、用户增长和营销活动策划。你了解各种营销手段和传播渠道，能够制定有效的营销策略。请从品牌定位、推广策略、渠道选择、用户运营等角度提供专业方案。', 'qwen-plus', 'ACTIVE');

-- 为test_user插入一个简单的代理
INSERT INTO agents (user_id, name, role_type, system_prompt, ai_model, status) VALUES 
(2, '通用助手', 'GENERAL', '你是一个通用的AI助手，能够从多个角度分析问题并提供建议。', 'qwen-plus', 'ACTIVE');

-- 插入一个示例会话
INSERT INTO brainstorm_sessions (user_id, title, description, topic, status, current_phase) VALUES 
(1, '环保主题帆布袋设计', '设计一款以环保为主题的文创帆布袋，融入中国传统文化元素', '设计一个环保主题的帆布袋文创产品', 'CREATED', NULL);

-- 为示例会话添加参与的代理
INSERT INTO session_agents (session_id, agent_id, status) VALUES 
(1, 1, 'ACTIVE'), -- 创意设计师
(1, 2, 'ACTIVE'), -- 市场调研专家
(1, 3, 'ACTIVE'), -- 文化研究学者
(1, 4, 'ACTIVE'), -- 产品工程师
(1, 5, 'ACTIVE'); -- 营销策划师

-- 初始化三个阶段
INSERT INTO phases (session_id, phase_type, status) VALUES 
(1, 'IDEA_GENERATION', 'NOT_STARTED'),
(1, 'FEASIBILITY_ANALYSIS', 'NOT_STARTED'),
(1, 'CRITICISM_DISCUSSION', 'NOT_STARTED');