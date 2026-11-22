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
    public static final String ATTENDANCE_STATS_CACHE = "attendance_stats";

    @Value("${fas.attendance.cooldown-seconds:120}")
    private long cooldownSeconds;

    @Value("${fas.attendance.stats-cache-seconds:30}")
    private long statsCacheSeconds;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(PUNCH_COOLDOWN_CACHE, ATTENDANCE_STATS_CACHE);
        cacheManager.registerCustomCache(PUNCH_COOLDOWN_CACHE,
                Caffeine.newBuilder()
                        .expireAfterWrite(cooldownSeconds, TimeUnit.SECONDS)
                        .maximumSize(50_000)
                        .recordStats()
                        .build());
        cacheManager.registerCustomCache(ATTENDANCE_STATS_CACHE,
                Caffeine.newBuilder()
                        .expireAfterWrite(statsCacheSeconds, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .recordStats()
                        .build());
        return cacheManager;
    }
}
