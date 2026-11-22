package com.fas.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Cấu hình Spring Task Scheduling cho các tác vụ nền định kỳ (SOL-BE-008).
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "fas.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulerConfig {
}
