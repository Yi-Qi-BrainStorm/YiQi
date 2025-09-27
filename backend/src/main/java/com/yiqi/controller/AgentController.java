package com.yiqi.controller;

import com.yiqi.dto.AgentResponse;
import com.yiqi.dto.AgentSummaryResponse;
import com.yiqi.dto.CreateAgentRequest;
import com.yiqi.dto.UpdateAgentRequest;
import com.yiqi.entity.User;
import com.yiqi.enums.AgentStatus;
import com.yiqi.enums.RoleType;
import com.yiqi.service.AgentService;
import com.yiqi.service.AgentValidationService;
import com.yiqi.service.UserDetailsServiceImpl;
import com.yiqi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AI代理管理控制器
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/agents")
@Tag(name = "AI代理管理", description = "AI代理的创建、查询、更新和删除操作")
public class AgentController {

    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);

    @Autowired
    private AgentService agentService;

    @Autowired
    private AgentValidationService agentValidationService;

    @Autowired
    private UserService userService;

    /**
     * 创建AI代理
     */
    @PostMapping
    @Operation(summary = "创建AI代理", description = "创建一个新的AI代理")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "代理创建成功"),
        @ApiResponse(responseCode = "400", description = "请求参数无效"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "409", description = "代理名称已存在")
    })
    public ResponseEntity<AgentResponse> createAgent(
            @Valid @RequestBody CreateAgentRequest request,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.info("用户 {} 创建AI代理: {}", userId, request.getName());

        AgentResponse response = agentService.createAgent(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 获取用户的代理列表
     */
    @GetMapping
    @Operation(summary = "获取代理列表", description = "获取当前用户的所有AI代理")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "401", description = "未授权")
    })
    public ResponseEntity<List<AgentSummaryResponse>> listAgents(
            @Parameter(description = "代理状态过滤") @RequestParam(required = false) String status,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.debug("用户 {} 获取代理列表，状态过滤: {}", userId, status);

        List<AgentSummaryResponse> agents;
        if (status != null && !status.trim().isEmpty()) {
            agents = agentService.getAgentsByUserIdAndStatus(userId, status.trim());
        } else {
            agents = agentService.getAgentsByUserId(userId);
        }

        return ResponseEntity.ok(agents);
    }

    /**
     * 获取代理详情
     */
    @GetMapping("/{agentId}")
    @Operation(summary = "获取代理详情", description = "根据ID获取AI代理的详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "404", description = "代理不存在")
    })
    public ResponseEntity<AgentResponse> getAgent(
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.debug("用户 {} 获取代理详情，代理ID: {}", userId, agentId);

        AgentResponse response = agentService.getAgentDetail(userId, agentId);
        return ResponseEntity.ok(response);
    }

    /**
     * 更新AI代理
     */
    @PutMapping("/{agentId}")
    @Operation(summary = "更新AI代理", description = "更新指定ID的AI代理信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功"),
        @ApiResponse(responseCode = "400", description = "请求参数无效"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "404", description = "代理不存在"),
        @ApiResponse(responseCode = "409", description = "代理名称已存在")
    })
    public ResponseEntity<AgentResponse> updateAgent(
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            @Valid @RequestBody UpdateAgentRequest request,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.info("用户 {} 更新AI代理，代理ID: {}", userId, agentId);

        AgentResponse response = agentService.updateAgent(userId, agentId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 删除AI代理
     */
    @DeleteMapping("/{agentId}")
    @Operation(summary = "删除AI代理", description = "删除指定ID的AI代理（软删除）")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "404", description = "代理不存在"),
        @ApiResponse(responseCode = "409", description = "代理正在被使用，无法删除")
    })
    public ResponseEntity<Void> deleteAgent(
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.info("用户 {} 删除AI代理，代理ID: {}", userId, agentId);

        agentService.deleteAgent(userId, agentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 激活代理
     */
    @PostMapping("/{agentId}/activate")
    @Operation(summary = "激活代理", description = "激活指定的AI代理")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "激活成功"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "404", description = "代理不存在")
    })
    public ResponseEntity<AgentResponse> activateAgent(
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.info("用户 {} 激活AI代理，代理ID: {}", userId, agentId);

        AgentResponse response = agentService.activateAgent(userId, agentId);
        return ResponseEntity.ok(response);
    }

    /**
     * 停用代理
     */
    @PostMapping("/{agentId}/deactivate")
    @Operation(summary = "停用代理", description = "停用指定的AI代理")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "停用成功"),
        @ApiResponse(responseCode = "401", description = "未授权"),
        @ApiResponse(responseCode = "404", description = "代理不存在"),
        @ApiResponse(responseCode = "409", description = "代理正在被使用，无法停用")
    })
    public ResponseEntity<AgentResponse> deactivateAgent(
            @Parameter(description = "代理ID") @PathVariable Long agentId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.info("用户 {} 停用AI代理，代理ID: {}", userId, agentId);

        AgentResponse response = agentService.deactivateAgent(userId, agentId);
        return ResponseEntity.ok(response);
    }

    /**
     * 根据角色类型获取活跃代理
     */
    @GetMapping("/by-role/{roleType}")
    @Operation(summary = "根据角色获取代理", description = "根据角色类型获取所有活跃的AI代理")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "400", description = "无效的角色类型")
    })
    public ResponseEntity<List<AgentSummaryResponse>> getAgentsByRoleType(
            @Parameter(description = "角色类型") @PathVariable String roleType) {
        
        logger.debug("根据角色类型获取活跃代理: {}", roleType);

        List<AgentSummaryResponse> agents = agentService.getActiveAgentsByRoleType(roleType);
        return ResponseEntity.ok(agents);
    }

    /**
     * 获取支持的角色类型列表
     */
    @GetMapping("/role-types")
    @Operation(summary = "获取角色类型", description = "获取所有支持的AI代理角色类型")
    @ApiResponse(responseCode = "200", description = "获取成功")
    public ResponseEntity<Map<String, Object>> getRoleTypes() {
        logger.debug("获取支持的角色类型列表");

        Map<String, Object> result = new HashMap<>();
        result.put("roleTypes", Arrays.asList(RoleType.values()));
        result.put("predefinedRoles", RoleType.getPredefinedRoles());
        
        return ResponseEntity.ok(result);
    }

    /**
     * 获取支持的代理状态列表
     */
    @GetMapping("/statuses")
    @Operation(summary = "获取代理状态", description = "获取所有支持的AI代理状态")
    @ApiResponse(responseCode = "200", description = "获取成功")
    public ResponseEntity<List<AgentStatus>> getAgentStatuses() {
        logger.debug("获取支持的代理状态列表");

        return ResponseEntity.ok(Arrays.asList(AgentStatus.values()));
    }

    /**
     * 获取支持的AI模型列表
     */
    @GetMapping("/ai-models")
    @Operation(summary = "获取AI模型", description = "获取所有支持的AI模型")
    @ApiResponse(responseCode = "200", description = "获取成功")
    public ResponseEntity<Set<String>> getSupportedAiModels() {
        logger.debug("获取支持的AI模型列表");

        Set<String> models = agentValidationService.getSupportedAiModels();
        return ResponseEntity.ok(models);
    }

    /**
     * 检查代理名称是否可用
     */
    @GetMapping("/check-name")
    @Operation(summary = "检查代理名称", description = "检查代理名称在用户下是否可用")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "检查完成"),
        @ApiResponse(responseCode = "401", description = "未授权")
    })
    public ResponseEntity<Map<String, Boolean>> checkAgentName(
            @Parameter(description = "代理名称") @RequestParam String name,
            @Parameter(description = "排除的代理ID（用于更新时检查）") @RequestParam(required = false) Long excludeId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuthentication(authentication);
        logger.debug("用户 {} 检查代理名称可用性: {}", userId, name);

        Map<String, Boolean> result = new HashMap<>();
        try {
            agentValidationService.validateNameUniqueness(userId, name, excludeId);
            result.put("available", true);
        } catch (Exception e) {
            result.put("available", false);
        }

        return ResponseEntity.ok(result);
    }

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
}