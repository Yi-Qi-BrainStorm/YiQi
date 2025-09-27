package com.yiqi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.AgentVersion;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * AI代理版本数据访问层接口
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface AgentVersionMapper extends BaseMapper<AgentVersion> {

    /**
     * 根据代理ID查询版本历史（按版本号降序）
     * 
     * @param agentId 代理ID
     * @return 版本历史列表
     */
    @Select("SELECT * FROM agent_versions WHERE agent_id = #{agentId} ORDER BY version_number DESC")
    List<AgentVersion> findByAgentIdOrderByVersionDesc(@Param("agentId") Long agentId);

    /**
     * 根据代理ID和版本号查询特定版本
     * 
     * @param agentId 代理ID
     * @param versionNumber 版本号
     * @return 版本记录
     */
    @Select("SELECT * FROM agent_versions WHERE agent_id = #{agentId} AND version_number = #{versionNumber}")
    AgentVersion findByAgentIdAndVersion(@Param("agentId") Long agentId, @Param("versionNumber") Integer versionNumber);

    /**
     * 根据代理ID查询最新版本
     * 
     * @param agentId 代理ID
     * @return 最新版本记录
     */
    @Select("SELECT * FROM agent_versions WHERE agent_id = #{agentId} ORDER BY version_number DESC LIMIT 1")
    AgentVersion findLatestByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据代理ID查询最大版本号
     * 
     * @param agentId 代理ID
     * @return 最大版本号
     */
    @Select("SELECT MAX(version_number) FROM agent_versions WHERE agent_id = #{agentId}")
    Integer findMaxVersionByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据代理ID统计版本数量
     * 
     * @param agentId 代理ID
     * @return 版本数量
     */
    @Select("SELECT COUNT(*) FROM agent_versions WHERE agent_id = #{agentId}")
    int countByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据代理ID删除所有版本记录
     * 
     * @param agentId 代理ID
     * @return 删除的记录数
     */
    @Delete("DELETE FROM agent_versions WHERE agent_id = #{agentId}")
    int deleteByAgentId(@Param("agentId") Long agentId);

    /**
     * 根据版本ID列表批量删除版本记录
     * 
     * @param ids 版本ID列表
     * @return 删除的记录数
     */
    int deleteByIds(@Param("ids") List<Long> ids);
}