package com.yiqi.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yiqi.dto.LoginRequest;
import com.yiqi.dto.LoginResponse;
import com.yiqi.dto.RegisterRequest;
import com.yiqi.dto.UserResponse;
import com.yiqi.entity.User;
import com.yiqi.exception.AuthenticationException;
import com.yiqi.exception.UserNotFoundException;
import com.yiqi.exception.ValidationException;
import com.yiqi.mapper.UserMapper;

/**
 * 用户服务层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    /**
     * 用户注册
     */
    public UserResponse register(RegisterRequest request) {
        logger.info("用户注册请求: {}", request.getUsername());

        // 检查用户名是否已存在
        if (userMapper.existsByUsername(request.getUsername()) > 0) {
            throw new ValidationException("用户名已存在");
        }

        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());

        // 保存用户
        int result = userMapper.insert(user);
        if (result <= 0) {
            throw new RuntimeException("用户注册失败");
        }

        logger.info("用户注册成功: {}", user.getUsername());
        return convertToUserResponse(user);
    }

    /**
     * 用户登录
     */
    public LoginResponse login(LoginRequest request) {
        logger.info("用户登录请求: {}", request.getUsername());

        // 查找用户
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new AuthenticationException("用户名或密码错误");
        }

        // 检查账户是否被锁定
        if (user.isAccountLocked()) {
            throw new AuthenticationException("账户已被锁定，请稍后再试");
        }

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // 增加登录失败次数
            user.incrementFailedLoginAttempts();
            userMapper.updateFailedLoginAttempts(user.getId(), 
                user.getFailedLoginAttempts(), user.getLockedUntil());
            
            logger.warn("用户登录失败: {} (失败次数: {})", user.getUsername(), user.getFailedLoginAttempts());
            throw new AuthenticationException("用户名或密码错误");
        }

        // 登录成功，重置失败次数并更新最后登录时间
        user.resetFailedLoginAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userMapper.resetFailedLoginAttempts(user.getId());
        userMapper.updateLastLoginTime(user.getId());

        // 生成JWT令牌
        String token = jwtService.generateToken(user.getUsername());

        logger.info("用户登录成功: {}", user.getUsername());
        return new LoginResponse(token, convertToUserResponse(user));
    }

    /**
     * 根据用户名查找用户
     */
    public User findByUsername(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new UserNotFoundException("用户不存在: " + username);
        }
        return user;
    }

    /**
     * 根据用户ID查找用户
     */
    public User findById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new UserNotFoundException("用户不存在: " + id);
        }
        return user;
    }

    /**
     * 获取用户信息
     */
    public UserResponse getUserInfo(String username) {
        User user = findByUsername(username);
        return convertToUserResponse(user);
    }

    /**
     * 转换为用户响应DTO
     */
    private UserResponse convertToUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getCreatedAt(),
            user.getLastLoginAt()
        );
    }
}
