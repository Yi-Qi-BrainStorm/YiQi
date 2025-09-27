package com.yiqi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.Phase;
import com.yiqi.enums.PhaseStatus;
import com.yiqi.enums.PhaseType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 头脑风暴阶段数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface PhaseMapper extends BaseMapper<Phase> {

    /**
     * 根据会话ID查询所有阶段
     * 
     * @param sessionId 会话ID
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} ORDER BY created_at ASC")
    List<Phase> findBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 根据会话ID和阶段类型查询阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @return 阶段信息
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} AND phase_type = #{phaseType}")
    Phase findBySessionIdAndPhaseType(@Param("sessionId") Long sessionId, @Param("phaseType") PhaseType phaseType);

    /**
     * 根据会话ID和状态查询阶段列表
     * 
     * @param sessionId 会话ID
     * @param status 阶段状态
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} AND status = #{status} ORDER BY created_at ASC")
    List<Phase> findBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") PhaseStatus status);

    /**
     * 查询会话的当前阶段
     * 
     * @param sessionId 会话ID
     * @return 当前阶段，如果没有进行中的阶段则返回null
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} AND status = 'IN_PROGRESS' LIMIT 1")
    Phase findCurrentPhaseBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 查询会话中等待审核的阶段
     * 
     * @param sessionId 会话ID
     * @return 等待审核的阶段列表
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} AND status = 'WAITING_APPROVAL' ORDER BY created_at ASC")
    List<Phase> findPendingApprovalPhasesBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 查询会话中已完成的阶段
     * 
     * @param sessionId 会话ID
     * @return 已完成的阶段列表
     */
    @Select("SELECT * FROM phases WHERE session_id = #{sessionId} AND status IN ('APPROVED', 'COMPLETED') ORDER BY created_at ASC")
    List<Phase> findCompletedPhasesBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 统计会话中的阶段数量
     * 
     * @param sessionId 会话ID
     * @return 阶段数量
     */
    @Select("SELECT COUNT(*) FROM phases WHERE session_id = #{sessionId}")
    Long countBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 统计会话中指定状态的阶段数量
     * 
     * @param sessionId 会话ID
     * @param status 阶段状态
     * @return 阶段数量
     */
    @Select("SELECT COUNT(*) FROM phases WHERE session_id = #{sessionId} AND status = #{status}")
    Long countBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") PhaseStatus status);

    /**
     * 查询指定状态的所有阶段
     * 
     * @param status 阶段状态
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE status = #{status} ORDER BY created_at ASC")
    List<Phase> findByStatus(@Param("status") PhaseStatus status);

    /**
     * 查询指定时间范围内开始的阶段
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE started_at BETWEEN #{startTime} AND #{endTime} ORDER BY started_at ASC")
    List<Phase> findByStartedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 查询指定时间范围内完成的阶段
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE completed_at BETWEEN #{startTime} AND #{endTime} ORDER BY completed_at ASC")
    List<Phase> findByCompletedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 查询长时间运行的阶段（可能需要干预）
     * 
     * @param beforeTime 时间阈值
     * @return 阶段列表
     */
    @Select("SELECT * FROM phases WHERE status = 'IN_PROGRESS' AND started_at < #{beforeTime} ORDER BY started_at ASC")
    List<Phase> findLongRunningPhasesBefore(@Param("beforeTime") LocalDateTime beforeTime);

    /**
     * 查询会话的阶段进度统计
     * 
     * @param sessionId 会话ID
     * @return 包含各状态阶段数量的统计信息
     */
    @Select("SELECT " +
            "COUNT(CASE WHEN status = 'NOT_STARTED' THEN 1 END) as not_started_count, " +
            "COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_count, " +
            "COUNT(CASE WHEN status = 'WAITING_APPROVAL' THEN 1 END) as waiting_approval_count, " +
            "COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count, " +
            "COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count, " +
            "COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count " +
            "FROM phases WHERE session_id = #{sessionId}")
    PhaseProgressStats getPhaseProgressStats(@Param("sessionId") Long sessionId);

    /**
     * 阶段进度统计结果类
     */
    class PhaseProgressStats {
        private Long notStartedCount;
        private Long inProgressCount;
        private Long waitingApprovalCount;
        private Long approvedCount;
        private Long rejectedCount;
        private Long completedCount;

        // Getter和Setter方法
        public Long getNotStartedCount() { return notStartedCount; }
        public void setNotStartedCount(Long notStartedCount) { this.notStartedCount = notStartedCount; }
        
        public Long getInProgressCount() { return inProgressCount; }
        public void setInProgressCount(Long inProgressCount) { this.inProgressCount = inProgressCount; }
        
        public Long getWaitingApprovalCount() { return waitingApprovalCount; }
        public void setWaitingApprovalCount(Long waitingApprovalCount) { this.waitingApprovalCount = waitingApprovalCount; }
        
        public Long getApprovedCount() { return approvedCount; }
        public void setApprovedCount(Long approvedCount) { this.approvedCount = approvedCount; }
        
        public Long getRejectedCount() { return rejectedCount; }
        public void setRejectedCount(Long rejectedCount) { this.rejectedCount = rejectedCount; }
        
        public Long getCompletedCount() { return completedCount; }
        public void setCompletedCount(Long completedCount) { this.completedCount = completedCount; }
    }
}