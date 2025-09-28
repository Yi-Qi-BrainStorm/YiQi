package com.yiqi.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.Report;
import com.yiqi.enums.ReportStatus;

/**
 * 报告数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface ReportMapper extends BaseMapper<Report> {

    /**
     * 根据会话ID查询报告
     * 
     * @param sessionId 会话ID
     * @return 报告信息
     */
    @Select("SELECT * FROM reports WHERE session_id = #{sessionId}")
    Report findBySessionId(@Param("sessionId") Long sessionId);

    // 已移除根据用户ID查询报告功能

    /**
     * 根据状态查询报告列表
     * 
     * @param status 报告状态
     * @return 报告列表
     */
    @Select("SELECT * FROM reports WHERE status = #{status} ORDER BY generated_at DESC")
    List<Report> findByStatus(@Param("status") ReportStatus status);

    /**
     * 查询指定时间范围内生成的报告
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 报告列表
     */
    @Select("SELECT * FROM reports WHERE generated_at BETWEEN #{startTime} AND #{endTime} ORDER BY generated_at DESC")
    List<Report> findByGeneratedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    // 已移除统计用户报告数量功能

    /**
     * 根据状态统计报告数量
     * 
     * @param status 报告状态
     * @return 报告数量
     */
    @Select("SELECT COUNT(*) FROM reports WHERE status = #{status}")
    Long countByStatus(@Param("status") ReportStatus status);

    /**
     * 查询最近生成的报告
     * 
     * @param limit 限制数量
     * @return 报告列表
     */
    @Select("SELECT * FROM reports ORDER BY generated_at DESC LIMIT #{limit}")
    List<Report> findRecentReports(@Param("limit") Integer limit);

    /**
     * 查询失败的报告
     * 
     * @return 失败的报告列表
     */
    @Select("SELECT * FROM reports WHERE status = 'FAILED' ORDER BY generated_at DESC")
    List<Report> findFailedReports();

    /**
     * 查询正在生成中的报告
     * 
     * @return 正在生成中的报告列表
     */
    @Select("SELECT * FROM reports WHERE status = 'GENERATING' ORDER BY generated_at DESC")
    List<Report> findGeneratingReports();
}
