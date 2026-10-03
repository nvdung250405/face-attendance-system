package com.fas.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cấu hình Spring Cache với Caffeine cho phân hệ Backend theo DBL-BE-004.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PUNCH_COOLDOWN_CACHE = "punch_cooldown";

    @Value("${fas.attendance.cooldown-seconds:120}")
    private long cooldownSeconds;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(PUNCH_COOLDOWN_CACHE);
        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(cooldownSeconds, TimeUnit.SECONDS)
                        .maximumSize(50_000)
                        .recordStats()
        );
        return cacheManager;
    }
}
