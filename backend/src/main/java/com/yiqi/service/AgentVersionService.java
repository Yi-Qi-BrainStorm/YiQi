package com.yiqi.service;

import com.yiqi.entity.Agent;
import com.yiqi.entity.AgentVersion;
import com.yiqi.mapper.AgentVersionMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AI代理版本管理服务
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
@Transactional
public class AgentVersionService {

    private static final Logger logger = LoggerFactory.getLogger(AgentVersionService.class);

    @Autowired
    private AgentVersionMapper agentVersionMapper;

    /**
     * 创建代理版本记录
     * 
     * @param agent 代理实体
     * @return 版本记录ID
     */
    public Long createVersion(Agent agent) {
        if (agent == null || agent.getId() == null) {
            logger.warn("无法为空代理或未保存的代理创建版本记录");
            return null;
        }

        logger.debug("为代理创建版本记录，代理ID: {}", agent.getId());

        // 获取下一个版本号
        Integer nextVersion = getNextVersionNumber(agent.getId());

        // 创建版本记录
        AgentVersion version = new AgentVersion();
        version.setAgentId(agent.getId());
        version.setVersionNumber(nextVersion);
        version.setName(agent.getName());
        version.setRoleType(agent.getRoleType());
        version.setSystemPrompt(agent.getSystemPrompt());
        version.setAiModel(agent.getAiModel());
        version.setStatus(agent.getStatus());

        int result = agentVersionMapper.insert(version);
        if (result > 0) {
            logger.info("成功创建代理版本记录，代理ID: {}, 版本号: {}, 版本记录ID: {}", 
                       agent.getId(), nextVersion, version.getId());
            return version.getId();
        } else {
            logger.error("创建代理版本记录失败，代理ID: {}", agent.getId());
            throw new RuntimeException("创建代理版本记录失败");
        }
    }

    /**
     * 获取代理的版本历史
     * 
     * @param agentId 代理ID
     * @return 版本历史列表
     */
    @Transactional(readOnly = true)
    public List<AgentVersion> getVersionHistory(Long agentId) {
        logger.debug("获取代理版本历史，代理ID: {}", agentId);
        return agentVersionMapper.findByAgentIdOrderByVersionDesc(agentId);
    }

    /**
     * 获取代理的特定版本
     * 
     * @param agentId 代理ID
     * @param versionNumber 版本号
     * @return 版本记录
     */
    @Transactional(readOnly = true)
    public AgentVersion getVersion(Long agentId, Integer versionNumber) {
        logger.debug("获取代理特定版本，代理ID: {}, 版本号: {}", agentId, versionNumber);
        return agentVersionMapper.findByAgentIdAndVersion(agentId, versionNumber);
    }

    /**
     * 获取代理的最新版本
     * 
     * @param agentId 代理ID
     * @return 最新版本记录
     */
    @Transactional(readOnly = true)
    public AgentVersion getLatestVersion(Long agentId) {
        logger.debug("获取代理最新版本，代理ID: {}", agentId);
        return agentVersionMapper.findLatestByAgentId(agentId);
    }

    /**
     * 删除代理的所有版本记录
     * 
     * @param agentId 代理ID
     * @return 删除的记录数
     */
    public int deleteVersionsByAgentId(Long agentId) {
        logger.info("删除代理的所有版本记录，代理ID: {}", agentId);
        return agentVersionMapper.deleteByAgentId(agentId);
    }

    /**
     * 清理旧版本记录（保留最近的N个版本）
     * 
     * @param agentId 代理ID
     * @param keepCount 保留的版本数量
     * @return 删除的记录数
     */
    public int cleanupOldVersions(Long agentId, int keepCount) {
        if (keepCount <= 0) {
            logger.warn("保留版本数量必须大于0，代理ID: {}", agentId);
            return 0;
        }

        logger.info("清理代理旧版本记录，代理ID: {}, 保留数量: {}", agentId, keepCount);

        List<AgentVersion> versions = agentVersionMapper.findByAgentIdOrderByVersionDesc(agentId);
        if (versions.size() <= keepCount) {
            logger.debug("版本数量不超过保留数量，无需清理，代理ID: {}", agentId);
            return 0;
        }

        // 获取需要删除的版本ID列表
        List<Long> versionsToDelete = versions.stream()
                .skip(keepCount)
                .map(AgentVersion::getId)
                .collect(java.util.stream.Collectors.toList());

        if (versionsToDelete.isEmpty()) {
            return 0;
        }

        int deletedCount = agentVersionMapper.deleteByIds(versionsToDelete);
        logger.info("成功清理代理旧版本记录，代理ID: {}, 删除数量: {}", agentId, deletedCount);
        return deletedCount;
    }

    /**
     * 获取代理的版本数量
     * 
     * @param agentId 代理ID
     * @return 版本数量
     */
    @Transactional(readOnly = true)
    public int getVersionCount(Long agentId) {
        return agentVersionMapper.countByAgentId(agentId);
    }

    /**
     * 比较两个版本的差异
     * 
     * @param agentId 代理ID
     * @param version1 版本1
     * @param version2 版本2
     * @return 版本差异信息
     */
    @Transactional(readOnly = true)
    public AgentVersionDiff compareVersions(Long agentId, Integer version1, Integer version2) {
        AgentVersion v1 = getVersion(agentId, version1);
        AgentVersion v2 = getVersion(agentId, version2);

        if (v1 == null || v2 == null) {
            throw new IllegalArgumentException("指定的版本不存在");
        }

        return new AgentVersionDiff(v1, v2);
    }

    /**
     * 获取下一个版本号
     * 
     * @param agentId 代理ID
     * @return 下一个版本号
     */
    private Integer getNextVersionNumber(Long agentId) {
        Integer maxVersion = agentVersionMapper.findMaxVersionByAgentId(agentId);
        return (maxVersion == null) ? 1 : maxVersion + 1;
    }

    /**
     * 版本差异信息类
     */
    public static class AgentVersionDiff {
        private final AgentVersion oldVersion;
        private final AgentVersion newVersion;
        private final boolean nameChanged;
        private final boolean roleTypeChanged;
        private final boolean systemPromptChanged;
        private final boolean aiModelChanged;
        private final boolean statusChanged;

        public AgentVersionDiff(AgentVersion oldVersion, AgentVersion newVersion) {
            this.oldVersion = oldVersion;
            this.newVersion = newVersion;
            this.nameChanged = !oldVersion.getName().equals(newVersion.getName());
            this.roleTypeChanged = !oldVersion.getRoleType().equals(newVersion.getRoleType());
            this.systemPromptChanged = !oldVersion.getSystemPrompt().equals(newVersion.getSystemPrompt());
            this.aiModelChanged = !oldVersion.getAiModel().equals(newVersion.getAiModel());
            this.statusChanged = !oldVersion.getStatus().equals(newVersion.getStatus());
        }

        // Getters
        public AgentVersion getOldVersion() { return oldVersion; }
        public AgentVersion getNewVersion() { return newVersion; }
        public boolean isNameChanged() { return nameChanged; }
        public boolean isRoleTypeChanged() { return roleTypeChanged; }
        public boolean isSystemPromptChanged() { return systemPromptChanged; }
        public boolean isAiModelChanged() { return aiModelChanged; }
        public boolean isStatusChanged() { return statusChanged; }

        public boolean hasChanges() {
            return nameChanged || roleTypeChanged || systemPromptChanged || aiModelChanged || statusChanged;
        }
    }
}