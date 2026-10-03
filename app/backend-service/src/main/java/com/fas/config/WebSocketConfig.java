package com.fas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP Message Broker phục vụ đồng bộ nạp nóng Hot-Patching theo FND-BE-005.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt Simple In-Memory Broker cho các topic phát sóng và queue cá nhân
        config.enableSimpleBroker("/topic", "/queue");
        // Tiền tố cho các message gửi từ client lên controller xử lý
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 1. Endpoint thuần STOMP qua WebSocket cho Kiosk Client (Python stomp.py)
        registry.addEndpoint("/ws", "/ws-attendance")
                .setAllowedOriginPatterns("*");

        // 2. Endpoint hỗ trợ SockJS fallback cho Web Portal Client (ReactJS)
        registry.addEndpoint("/ws", "/ws-attendance")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
