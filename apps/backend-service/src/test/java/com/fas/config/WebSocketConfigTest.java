package com.fas.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class WebSocketConfigTest {

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private WebSocketConfig webSocketConfig;

    @Test
    @DisplayName("WebSocket STOMP Broker và SimpMessagingTemplate được khởi tạo thành công")
    void webSocketAndBrokerShouldBeLoaded() {
        assertThat(webSocketConfig).isNotNull();
        assertThat(messagingTemplate).isNotNull();
    }
}
