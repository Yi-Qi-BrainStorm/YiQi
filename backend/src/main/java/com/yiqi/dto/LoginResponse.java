package com.yiqi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 登录响应DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Schema(description = "登录响应")
public class LoginResponse {

    @Schema(description = "JWT访问令牌")
    private String accessToken;

    @Schema(description = "令牌类型", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "用户信息")
    private UserResponse user;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, UserResponse user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "accessToken='[PROTECTED]'" +
                ", tokenType='" + tokenType + '\'' +
                ", user=" + user +
                '}';
    }
}
