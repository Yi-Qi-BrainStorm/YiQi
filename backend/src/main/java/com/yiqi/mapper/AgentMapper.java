package com.yiqi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.Agent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * AI代理数据访问层接口
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface AgentMapper extends BaseMapper<Agent> {

    /**
     * 根据用户ID查询所有代理
     * 
     * @param userId 用户ID
     * @return 代理列表
     */
    @Select("SELECT * FROM agents WHERE user_id = #{userId} AND status != 'DELETED' ORDER BY created_at DESC")
    List<Agent> findByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID和代理状态查询代理
     * 
     * @param userId 用户ID
     * @param status 代理状态
     * @return 代理列表
     */
    @Select("SELECT * FROM agents WHERE user_id = #{userId} AND status = #{status} ORDER BY created_at DESC")
    List<Agent> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);

    /**
     * 根据角色类型查询代理
     * 
     * @param roleType 角色类型
     * @return 代理列表
     */
    @Select("SELECT * FROM agents WHERE role_type = #{roleType} AND status = 'ACTIVE' ORDER BY created_at DESC")
    List<Agent> findByRoleType(@Param("roleType") String roleType);

    /**
     * 检查代理名称在用户下是否唯一
     * 
     * @param userId 用户ID
     * @param name 代理名称
     * @param excludeId 排除的代理ID（用于更新时检查）
     * @return 存在的代理数量
     */
    @Select("SELECT COUNT(*) FROM agents WHERE user_id = #{userId} AND name = #{name} AND status != 'DELETED' " +
            "AND (#{excludeId} IS NULL OR id != #{excludeId})")
    int countByUserIdAndName(@Param("userId") Long userId, @Param("name") String name, @Param("excludeId") Long excludeId);

    /**
     * 检查代理是否被会话使用
     * 
     * @param agentId 代理ID
     * @return 使用该代理的会话数量
     */
    @Select("SELECT COUNT(*) FROM session_agents sa " +
            "JOIN brainstorm_sessions bs ON sa.session_id = bs.id " +
            "WHERE sa.agent_id = #{agentId} AND bs.status IN ('CREATED', 'IN_PROGRESS', 'PAUSED')")
    int countActiveSessionsByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据用户ID和代理ID查询代理（用于权限检查）
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @return 代理实体
     */
    @Select("SELECT * FROM agents WHERE id = #{agentId} AND user_id = #{userId} AND status != 'DELETED'")
    Agent findByIdAndUserId(@Param("agentId") Long agentId, @Param("userId") Long userId);

    /**
     * 根据ID列表查询代理
     * 
     * @param agentIds 代理ID列表
     * @return 代理列表
     */
    @Select("<script>" +
            "SELECT * FROM agents WHERE id IN " +
            "<foreach item='id' collection='agentIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND status != 'DELETED' ORDER BY created_at DESC" +
            "</script>")
    List<Agent> findByIds(@Param("agentIds") List<Long> agentIds);
}