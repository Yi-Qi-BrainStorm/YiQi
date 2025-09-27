package com.yiqi.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI服务配置属性类
 * 用于绑定application.yml中的AI服务相关配置
 */
@Component
@ConfigurationProperties(prefix = "yiqi.ai")
public class AIServiceProperties {

    private QiniuConfig qiniu = new QiniuConfig();
    private AliyunConfig aliyun = new AliyunConfig();

    public QiniuConfig getQiniu() {
        return qiniu;
    }

    public void setQiniu(QiniuConfig qiniu) {
        this.qiniu = qiniu;
    }

    public AliyunConfig getAliyun() {
        return aliyun;
    }

    public void setAliyun(AliyunConfig aliyun) {
        this.aliyun = aliyun;
    }

    /**
     * 七牛云AI服务配置
     */
    public static class QiniuConfig {
        private String apiKey;
        private String baseUrl;
        private String backupUrl;
        private int timeout = 30000;
        private int retryAttempts = 3;
        private String model;

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getBackupUrl() {
            return backupUrl;
        }

        public void setBackupUrl(String backupUrl) {
            this.backupUrl = backupUrl;
        }

        public int getTimeout() {
            return timeout;
        }

        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }

        public int getRetryAttempts() {
            return retryAttempts;
        }

        public void setRetryAttempts(int retryAttempts) {
            this.retryAttempts = retryAttempts;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }
    }

    /**
     * 阿里云AI服务配置
     */
    public static class AliyunConfig {
        private String accessKeyId;
        private String accessKeySecret;
        private String endpoint;
        private int timeout = 60000;
        private String[] models;

        public String getAccessKeyId() {
            return accessKeyId;
        }

        public void setAccessKeyId(String accessKeyId) {
            this.accessKeyId = accessKeyId;
        }

        public String getAccessKeySecret() {
            return accessKeySecret;
        }

        public void setAccessKeySecret(String accessKeySecret) {
            this.accessKeySecret = accessKeySecret;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public int getTimeout() {
            return timeout;
        }

        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }

        public String[] getModels() {
            return models;
        }

        public void setModels(String[] models) {
            this.models = models;
        }
    }
}