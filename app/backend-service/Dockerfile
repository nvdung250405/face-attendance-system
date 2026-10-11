# ==============================================================================
# Multi-stage Dockerfile cho FAS Backend Service (Spring Boot 4.x / Java 21)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application Artifact với JDK 21
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

# Sao chép Maven Wrapper & tệp định nghĩa POM để tận dụng Docker layer cache
COPY .mvn .mvn
COPY mvnw pom.xml ./

# Chuẩn hóa kết thúc dòng CRLF sang LF và cấp quyền thực thi cho Maven Wrapper
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Tải trước các dependencies
RUN ./mvnw dependency:go-offline -B

# Sao chép mã nguồn và thực thi đóng gói JAR (bỏ qua kiểm thử khi build container)
COPY src src
RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Runtime Image tinh gọn với JRE 21 Alpine
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Thiết lập người dùng bảo mật không đặc quyền (non-root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Sao chép file JAR đã đóng gói từ build stage
COPY --from=builder /workspace/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser:appgroup

EXPOSE 8080

# Cấu hình kiểm tra sức khỏe ứng dụng qua Actuator
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Kích hoạt ảo hóa Virtual Threads của Java 21 và nguồn sinh ngẫu nhiên bảo mật
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
