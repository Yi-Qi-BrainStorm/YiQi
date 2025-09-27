package com.yiqi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.SessionAgent;
import com.yiqi.enums.AgentStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Delete;

import java.util.List;

/**
 * 会话代理关联数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface SessionAgentMapper extends BaseMapper<SessionAgent> {

    /**
     * 根据会话ID查询参与的代理列表
     * 
     * @param sessionId 会话ID
     * @return 会话代理关联列表
     */
    @Select("SELECT * FROM session_agents WHERE session_id = #{sessionId} ORDER BY joined_at ASC")
    List<SessionAgent> findBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 根据代理ID查询参与的会话列表
     * 
     * @param agentId 代理ID
     * @return 会话代理关联列表
     */
    @Select("SELECT * FROM session_agents WHERE agent_id = #{agentId} ORDER BY joined_at DESC")
    List<SessionAgent> findByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据会话ID和状态查询代理列表
     * 
     * @param sessionId 会话ID
     * @param status 代理状态
     * @return 会话代理关联列表
     */
    @Select("SELECT * FROM session_agents WHERE session_id = #{sessionId} AND status = #{status} ORDER BY joined_at ASC")
    List<SessionAgent> findBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") AgentStatus status);

    /**
     * 查询会话中的活跃代理
     * 
     * @param sessionId 会话ID
     * @return 活跃代理列表
     */
    @Select("SELECT * FROM session_agents WHERE session_id = #{sessionId} AND status = 'ACTIVE' ORDER BY joined_at ASC")
    List<SessionAgent> findActiveAgentsBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 检查代理是否已参与会话
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @return 会话代理关联记录，如果不存在则返回null
     */
    @Select("SELECT * FROM session_agents WHERE session_id = #{sessionId} AND agent_id = #{agentId}")
    SessionAgent findBySessionIdAndAgentId(@Param("sessionId") Long sessionId, @Param("agentId") Long agentId);

    /**
     * 统计会话中的代理数量
     * 
     * @param sessionId 会话ID
     * @return 代理数量
     */
    @Select("SELECT COUNT(*) FROM session_agents WHERE session_id = #{sessionId}")
    Long countBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 统计会话中指定状态的代理数量
     * 
     * @param sessionId 会话ID
     * @param status 代理状态
     * @return 代理数量
     */
    @Select("SELECT COUNT(*) FROM session_agents WHERE session_id = #{sessionId} AND status = #{status}")
    Long countBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") AgentStatus status);

    /**
     * 统计代理参与的会话数量
     * 
     * @param agentId 代理ID
     * @return 会话数量
     */
    @Select("SELECT COUNT(*) FROM session_agents WHERE agent_id = #{agentId}")
    Long countByAgentId(@Param("agentId") Long agentId);

    /**
     * 统计代理参与的指定状态会话数量
     * 
     * @param agentId 代理ID
     * @param status 代理状态
     * @return 会话数量
     */
    @Select("SELECT COUNT(*) FROM session_agents WHERE agent_id = #{agentId} AND status = #{status}")
    Long countByAgentIdAndStatus(@Param("agentId") Long agentId, @Param("status") AgentStatus status);

    /**
     * 删除会话中的所有代理关联
     * 
     * @param sessionId 会话ID
     * @return 删除的记录数
     */
    @Delete("DELETE FROM session_agents WHERE session_id = #{sessionId}")
    int deleteBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 删除指定的会话代理关联
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @return 删除的记录数
     */
    @Delete("DELETE FROM session_agents WHERE session_id = #{sessionId} AND agent_id = #{agentId}")
    int deleteBySessionIdAndAgentId(@Param("sessionId") Long sessionId, @Param("agentId") Long agentId);

    /**
     * 查询代理的详细信息（包含代理基本信息）
     * 
     * @param sessionId 会话ID
     * @return 包含代理详细信息的会话代理关联列表
     */
    @Select("SELECT sa.*, a.name as agent_name, a.role_type, a.system_prompt " +
            "FROM session_agents sa " +
            "LEFT JOIN agents a ON sa.agent_id = a.id " +
            "WHERE sa.session_id = #{sessionId} " +
            "ORDER BY sa.joined_at ASC")
    List<SessionAgent> findSessionAgentsWithDetails(@Param("sessionId") Long sessionId);
}