package com.yiqi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.AgentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 代理响应数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface AgentResponseMapper extends BaseMapper<AgentResponse> {

    /**
     * 根据阶段ID查询所有代理响应
     * 
     * @param phaseId 阶段ID
     * @return 代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE phase_id = #{phaseId} ORDER BY created_at ASC")
    List<AgentResponse> findByPhaseId(@Param("phaseId") Long phaseId);

    /**
     * 根据代理ID查询所有响应
     * 
     * @param agentId 代理ID
     * @return 代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE agent_id = #{agentId} ORDER BY created_at DESC")
    List<AgentResponse> findByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据阶段ID和代理ID查询响应
     * 
     * @param phaseId 阶段ID
     * @param agentId 代理ID
     * @return 代理响应
     */
    @Select("SELECT * FROM agent_responses WHERE phase_id = #{phaseId} AND agent_id = #{agentId}")
    AgentResponse findByPhaseIdAndAgentId(@Param("phaseId") Long phaseId, @Param("agentId") Long agentId);

    /**
     * 根据阶段ID和状态查询响应列表
     * 
     * @param phaseId 阶段ID
     * @param status 响应状态
     * @return 代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE phase_id = #{phaseId} AND status = #{status} ORDER BY created_at ASC")
    List<AgentResponse> findByPhaseIdAndStatus(@Param("phaseId") Long phaseId, @Param("status") String status);

    /**
     * 查询阶段中成功的响应
     * 
     * @param phaseId 阶段ID
     * @return 成功的代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE phase_id = #{phaseId} AND status = 'SUCCESS' ORDER BY created_at ASC")
    List<AgentResponse> findSuccessfulResponsesByPhaseId(@Param("phaseId") Long phaseId);

    /**
     * 查询阶段中失败的响应
     * 
     * @param phaseId 阶段ID
     * @return 失败的代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE phase_id = #{phaseId} AND status IN ('FAILED', 'TIMEOUT') ORDER BY created_at ASC")
    List<AgentResponse> findFailedResponsesByPhaseId(@Param("phaseId") Long phaseId);

    /**
     * 统计阶段中的响应数量
     * 
     * @param phaseId 阶段ID
     * @return 响应数量
     */
    @Select("SELECT COUNT(*) FROM agent_responses WHERE phase_id = #{phaseId}")
    Long countByPhaseId(@Param("phaseId") Long phaseId);

    /**
     * 统计阶段中指定状态的响应数量
     * 
     * @param phaseId 阶段ID
     * @param status 响应状态
     * @return 响应数量
     */
    @Select("SELECT COUNT(*) FROM agent_responses WHERE phase_id = #{phaseId} AND status = #{status}")
    Long countByPhaseIdAndStatus(@Param("phaseId") Long phaseId, @Param("status") String status);

    /**
     * 统计代理的响应数量
     * 
     * @param agentId 代理ID
     * @return 响应数量
     */
    @Select("SELECT COUNT(*) FROM agent_responses WHERE agent_id = #{agentId}")
    Long countByAgentId(@Param("agentId") Long agentId);

    /**
     * 统计代理指定状态的响应数量
     * 
     * @param agentId 代理ID
     * @param status 响应状态
     * @return 响应数量
     */
    @Select("SELECT COUNT(*) FROM agent_responses WHERE agent_id = #{agentId} AND status = #{status}")
    Long countByAgentIdAndStatus(@Param("agentId") Long agentId, @Param("status") String status);

    /**
     * 查询指定时间范围内的响应
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 代理响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE created_at BETWEEN #{startTime} AND #{endTime} ORDER BY created_at ASC")
    List<AgentResponse> findByCreatedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 查询响应时间超过阈值的响应（性能分析）
     * 
     * @param thresholdMs 响应时间阈值（毫秒）
     * @return 慢响应列表
     */
    @Select("SELECT * FROM agent_responses WHERE response_time_ms > #{thresholdMs} ORDER BY response_time_ms DESC")
    List<AgentResponse> findSlowResponses(@Param("thresholdMs") Long thresholdMs);

    /**
     * 查询代理的平均响应时间
     * 
     * @param agentId 代理ID
     * @return 平均响应时间（毫秒）
     */
    @Select("SELECT AVG(response_time_ms) FROM agent_responses WHERE agent_id = #{agentId} AND status = 'SUCCESS'")
    Double getAverageResponseTimeByAgentId(@Param("agentId") Long agentId);

    /**
     * 查询阶段的响应统计信息
     * 
     * @param phaseId 阶段ID
     * @return 响应统计信息
     */
    @Select("SELECT " +
            "COUNT(*) as total_count, " +
            "COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success_count, " +
            "COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count, " +
            "COUNT(CASE WHEN status = 'TIMEOUT' THEN 1 END) as timeout_count, " +
            "COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) as processing_count, " +
            "AVG(CASE WHEN status = 'SUCCESS' THEN response_time_ms END) as avg_response_time " +
            "FROM agent_responses WHERE phase_id = #{phaseId}")
    ResponseStats getResponseStatsByPhaseId(@Param("phaseId") Long phaseId);

    /**
     * 查询会话的所有响应（跨阶段）
     * 
     * @param sessionId 会话ID
     * @return 代理响应列表
     */
    @Select("SELECT ar.* FROM agent_responses ar " +
            "JOIN phases p ON ar.phase_id = p.id " +
            "WHERE p.session_id = #{sessionId} " +
            "ORDER BY p.created_at ASC, ar.created_at ASC")
    List<AgentResponse> findBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 响应统计结果类
     */
    class ResponseStats {
        private Long totalCount;
        private Long successCount;
        private Long failedCount;
        private Long timeoutCount;
        private Long processingCount;
        private Double avgResponseTime;

        // Getter和Setter方法
        public Long getTotalCount() { return totalCount; }
        public void setTotalCount(Long totalCount) { this.totalCount = totalCount; }
        
        public Long getSuccessCount() { return successCount; }
        public void setSuccessCount(Long successCount) { this.successCount = successCount; }
        
        public Long getFailedCount() { return failedCount; }
        public void setFailedCount(Long failedCount) { this.failedCount = failedCount; }
        
        public Long getTimeoutCount() { return timeoutCount; }
        public void setTimeoutCount(Long timeoutCount) { this.timeoutCount = timeoutCount; }
        
        public Long getProcessingCount() { return processingCount; }
        public void setProcessingCount(Long processingCount) { this.processingCount = processingCount; }
        
        public Double getAvgResponseTime() { return avgResponseTime; }
        public void setAvgResponseTime(Double avgResponseTime) { this.avgResponseTime = avgResponseTime; }
    }
}