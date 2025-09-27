package com.yiqi.controller;

import com.yiqi.dto.CreateSessionRequest;
import com.yiqi.dto.SessionResponse;
import com.yiqi.dto.SessionStatusResponse;
import com.yiqi.dto.StartSessionRequest;
import com.yiqi.dto.SubmitPhaseForApprovalRequest;
import com.yiqi.entity.Phase;
import com.yiqi.entity.User;
import com.yiqi.enums.PhaseType;
import com.yiqi.service.PhaseService;
import com.yiqi.service.SessionService;
import com.yiqi.service.UserDetailsServiceImpl;
import com.yiqi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 头脑风暴会话管理控制器
 * 提供会话创建、启动、状态管理和阶段控制的API端点
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/sessions")
@Tag(name = "会话管理", description = "头脑风暴会话管理相关API")
public class SessionController {

    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);

    @Autowired
    private SessionService sessionService;

    @Autowired
    private PhaseService phaseService;

    @Autowired
    private UserService userService;

    /**
     * 创建新的头脑风暴会话
     * 
     * @param request 创建会话请求
     * @param authentication 认证信息
     * @return 会话响应
     */
    @PostMapping
    @Operation(summary = "创建头脑风暴会话", description = "创建一个新的头脑风暴会话，并选择参与的AI代理")
    public ResponseEntity<SessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        SessionResponse response = sessionService.createSession(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 启动头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @param request 启动会话请求
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/start")
    @Operation(summary = "启动头脑风暴会话", description = "设置头脑风暴主题并启动会话")
    public ResponseEntity<Void> startSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Valid @RequestBody StartSessionRequest request,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.startSession(sessionId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * 暂停头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/pause")
    @Operation(summary = "暂停头脑风暴会话", description = "暂停正在进行的头脑风暴会话")
    public ResponseEntity<Void> pauseSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.pauseSession(sessionId);
        return ResponseEntity.ok().build();
    }

    /**
     * 恢复头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/resume")
    @Operation(summary = "恢复头脑风暴会话", description = "恢复已暂停的头脑风暴会话")
    public ResponseEntity<Void> resumeSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.resumeSession(sessionId);
        return ResponseEntity.ok().build();
    }

    /**
     * 取消头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/cancel")
    @Operation(summary = "取消头脑风暴会话", description = "取消头脑风暴会话")
    public ResponseEntity<Void> cancelSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.cancelSession(sessionId);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取会话状态
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 会话状态响应
     */
    @GetMapping("/{sessionId}/status")
    @Operation(summary = "获取会话状态", description = "获取头脑风暴会话的详细状态信息")
    public ResponseEntity<SessionStatusResponse> getSessionStatus(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        SessionStatusResponse response = sessionService.getSessionStatus(sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户的会话列表
     * 
     * @param authentication 认证信息
     * @return 会话列表
     */
    @GetMapping
    @Operation(summary = "获取用户会话列表", description = "获取当前用户的所有头脑风暴会话")
    public ResponseEntity<List<SessionResponse>> getUserSessions(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<SessionResponse> sessions = sessionService.getUserSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * 获取用户的活跃会话
     * 
     * @param authentication 认证信息
     * @return 活跃会话列表
     */
    @GetMapping("/active")
    @Operation(summary = "获取用户活跃会话", description = "获取当前用户正在进行或暂停的会话")
    public ResponseEntity<List<SessionResponse>> getUserActiveSessions(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<SessionResponse> sessions = sessionService.getUserActiveSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * 审核通过阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/phases/{phaseType}/approve")
    @Operation(summary = "审核通过阶段", description = "审核通过指定的头脑风暴阶段")
    public ResponseEntity<Void> approvePhase(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        phaseService.approvePhase(sessionId, phaseType);
        return ResponseEntity.ok().build();
    }

    /**
     * 审核拒绝阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/phases/{phaseType}/reject")
    @Operation(summary = "审核拒绝阶段", description = "审核拒绝指定的头脑风暴阶段，需要重新执行")
    public ResponseEntity<Void> rejectPhase(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        phaseService.rejectPhase(sessionId, phaseType);
        return ResponseEntity.ok().build();
    }

    /**
     * 重新执行阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/phases/{phaseType}/retry")
    @Operation(summary = "重新执行阶段", description = "重新执行被拒绝的头脑风暴阶段")
    public ResponseEntity<Void> retryPhase(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        phaseService.retryPhase(sessionId, phaseType);
        return ResponseEntity.ok().build();
    }

    /**
     * 提交阶段审核
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param request 提交审核请求
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/phases/{phaseType}/submit-for-approval")
    @Operation(summary = "提交阶段审核", description = "提交头脑风暴阶段的结果等待用户审核")
    public ResponseEntity<Void> submitPhaseForApproval(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            @Valid @RequestBody SubmitPhaseForApprovalRequest request,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        phaseService.submitPhaseForApproval(sessionId, phaseType, request.getSummary());
        return ResponseEntity.ok().build();
    }

    /**
     * 获取阶段详情
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param authentication 认证信息
     * @return 阶段详情
     */
    @GetMapping("/{sessionId}/phases/{phaseType}")
    @Operation(summary = "获取阶段详情", description = "获取指定头脑风暴阶段的详细信息")
    public ResponseEntity<Phase> getPhase(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        Phase phase = phaseService.getPhase(sessionId, phaseType);
        return ResponseEntity.ok(phase);
    }

    /**
     * 获取会话的所有阶段
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 阶段列表
     */
    @GetMapping("/{sessionId}/phases")
    @Operation(summary = "获取会话阶段列表", description = "获取会话的所有头脑风暴阶段")
    public ResponseEntity<List<Phase>> getSessionPhases(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        List<Phase> phases = phaseService.getSessionPhases(sessionId);
        return ResponseEntity.ok(phases);
    }

    /**
     * 添加代理到会话
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @param authentication 认证信息
     * @return 成功响应
     */
    @PostMapping("/{sessionId}/agents/{agentId}")
    @Operation(summary = "添加代理到会话", description = "向头脑风暴会话中添加新的AI代理")
    public ResponseEntity<Void> addAgentToSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.addAgentToSession(sessionId, agentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 从会话中移除代理
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @param authentication 认证信息
     * @return 成功响应
     */
    @DeleteMapping("/{sessionId}/agents/{agentId}")
    @Operation(summary = "从会话中移除代理", description = "从头脑风暴会话中移除指定的AI代理")
    public ResponseEntity<Void> removeAgentFromSession(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        sessionService.removeAgentFromSession(sessionId, agentId);
        return ResponseEntity.ok().build();
    }

    // 私有辅助方法

    /**
     * 从认证信息中获取用户ID
     * 
     * @param authentication 认证信息
     * @return 用户ID
     */
    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() != null) {
            // 从UserPrincipal中获取用户ID
            if (authentication.getPrincipal() instanceof UserDetailsServiceImpl.UserPrincipal) {
                UserDetailsServiceImpl.UserPrincipal userPrincipal = 
                    (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
                return userPrincipal.getUser().getId();
            }
            
            // 如果principal是字符串（用户名），需要通过用户名查找用户ID
            String username = authentication.getName();
            if (username != null && !username.trim().isEmpty()) {
                try {
                    // 注入UserService来根据用户名获取用户ID
                    User user = userService.findByUsername(username);
                    if (user != null) {
                        return user.getId();
                    }
                } catch (Exception e) {
                    logger.error("根据用户名查找用户失败: {}", username, e);
                }
            }
            
            logger.error("无法从认证信息中获取用户ID，principal类型: {}, name: {}", 
                        authentication.getPrincipal().getClass().getName(), authentication.getName());
            throw new RuntimeException("无效的用户认证信息");
        }
        throw new RuntimeException("用户未认证");
    }

    /**
     * 验证会话所有权
     * 确保当前用户有权限操作指定的会话
     */
    private void validateSessionOwnership(Long sessionId, Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        sessionService.validateSessionOwnership(sessionId, userId);
    }
}