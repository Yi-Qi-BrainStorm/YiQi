package com.yiqi.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yiqi.entity.User;

/**
 * 用户数据访问层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查找用户
     * 
     * @param username 用户名
     * @return 用户实体
     */
    @Select("SELECT * FROM users WHERE username = #{username}")
    User findByUsername(@Param("username") String username);

    /**
     * 更新用户最后登录时间
     * 
     * @param userId 用户ID
     * @return 更新行数
     */
    @Update("UPDATE users SET last_login_at = NOW() WHERE id = #{userId}")
    int updateLastLoginTime(@Param("userId") Long userId);

    /**
     * 重置用户登录失败次数
     * 
     * @param userId 用户ID
     * @return 更新行数
     */
    @Update("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = #{userId}")
    int resetFailedLoginAttempts(@Param("userId") Long userId);

    /**
     * 增加用户登录失败次数
     * 
     * @param userId 用户ID
     * @param attempts 失败次数
     * @param lockedUntil 锁定到期时间
     * @return 更新行数
     */
    @Update("UPDATE users SET failed_login_attempts = #{attempts}, locked_until = #{lockedUntil} WHERE id = #{userId}")
    int updateFailedLoginAttempts(@Param("userId") Long userId, 
                                  @Param("attempts") Integer attempts, 
                                  @Param("lockedUntil") java.time.LocalDateTime lockedUntil);

    /**
     * 检查用户名是否存在
     * 
     * @param username 用户名
     * @return 存在返回1，不存在返回0
     */
    @Select("SELECT COUNT(1) FROM users WHERE username = #{username}")
    int existsByUsername(@Param("username") String username);
}
