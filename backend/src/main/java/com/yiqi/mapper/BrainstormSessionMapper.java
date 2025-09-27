package com.yiqi.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.BrainstormSession;
import com.yiqi.enums.SessionStatus;

/**
 * 头脑风暴会话数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface BrainstormSessionMapper extends BaseMapper<BrainstormSession> {

    /**
     * 根据用户ID查询会话列表
     * 
     * @param userId 用户ID
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<BrainstormSession> findByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID和状态查询会话列表
     * 
     * @param userId 用户ID
     * @param status 会话状态
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE user_id = #{userId} AND status = #{status} ORDER BY created_at DESC")
    List<BrainstormSession> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);

    /**
     * 根据状态查询会话列表
     * 
     * @param status 会话状态
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE status = #{status} ORDER BY created_at DESC")
    List<BrainstormSession> findByStatus(@Param("status") SessionStatus status);

    /**
     * 查询用户的活跃会话（进行中或暂停状态）
     * 
     * @param userId 用户ID
     * @return 活跃会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE user_id = #{userId} AND status IN ('IN_PROGRESS', 'PAUSED') ORDER BY updated_at DESC")
    List<BrainstormSession> findActiveSessionsByUserId(@Param("userId") Long userId);

    /**
     * 统计用户的会话数量
     * 
     * @param userId 用户ID
     * @return 会话数量
     */
    @Select("SELECT COUNT(*) FROM brainstorm_sessions WHERE user_id = #{userId}")
    Long countByUserId(@Param("userId") Long userId);

    /**
     * 统计用户指定状态的会话数量
     * 
     * @param userId 用户ID
     * @param status 会话状态
     * @return 会话数量
     */
    @Select("SELECT COUNT(*) FROM brainstorm_sessions WHERE user_id = #{userId} AND status = #{status}")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);

    /**
     * 查询指定时间范围内创建的会话
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE created_at BETWEEN #{startTime} AND #{endTime} ORDER BY created_at DESC")
    List<BrainstormSession> findByCreatedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 查询用户最近的会话
     * 
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE user_id = #{userId} ORDER BY updated_at DESC LIMIT #{limit}")
    List<BrainstormSession> findRecentSessionsByUserId(@Param("userId") Long userId, @Param("limit") Integer limit);

    /**
     * 根据标题模糊查询用户的会话
     * 
     * @param userId 用户ID
     * @param title 标题关键词
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE user_id = #{userId} AND title LIKE CONCAT('%', #{title}, '%') ORDER BY created_at DESC")
    List<BrainstormSession> findByUserIdAndTitleLike(@Param("userId") Long userId, @Param("title") String title);

    /**
     * 查询长时间未更新的会话（可能需要清理）
     * 
     * @param beforeTime 时间阈值
     * @return 会话列表
     */
    @Select("SELECT * FROM brainstorm_sessions WHERE updated_at < #{beforeTime} AND status IN ('CREATED', 'PAUSED') ORDER BY updated_at ASC")
    List<BrainstormSession> findStaleSessionsBefore(@Param("beforeTime") LocalDateTime beforeTime);
}