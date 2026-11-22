package com.fas.config;

import com.fas.security.websocket.StompChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP Message Broker phục vụ đồng bộ nạp nóng Hot-Patching theo FND-BE-005
 * và phân quyền truy cập kênh qua ChannelInterceptor theo APD-BE-005, DD-BE-011.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelInterceptor stompChannelInterceptor;

    public WebSocketConfig(StompChannelInterceptor stompChannelInterceptor) {
        this.stompChannelInterceptor = stompChannelInterceptor;
    }

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

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompChannelInterceptor);
    }
}
