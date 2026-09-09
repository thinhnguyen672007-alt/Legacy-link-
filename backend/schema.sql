-- ====================================================================
-- DỰ ÁN LEGACY-LINK (DENSO HACKATHON)
-- Database Schema: Hệ thống thu thập dữ liệu máy legacy không có IPC
-- ====================================================================

CREATE DATABASE IF NOT EXISTS iot_legacylink 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE iot_legacylink;

-- 1. BẢNG DANH MỤC MÁY & TRẠNG THÁI HIỆN TẠI (Current State)
-- Dùng cho Dashboard quản lý để hiển thị trạng thái realtime của tất cả các máy
CREATE TABLE IF NOT EXISTS machines (
    machine_code VARCHAR(50) PRIMARY KEY,      -- Mã định danh máy (VD: PRESS-MCH-01, CNC-02)
    gateway_id VARCHAR(50) NOT NULL,          -- Cục ESP32 nào đang quản lý máy này
    machine_name VARCHAR(100) DEFAULT NULL,    -- Tên hiển thị dễ đọc
    status VARCHAR(20) DEFAULT 'OFFLINE',      -- RUNNING, IDLE, ERROR, OFFLINE
    last_metrics JSON DEFAULT NULL,            -- Giá trị các cảm biến đo được mới nhất
    last_seen TIMESTAMP NULL DEFAULT NULL,     -- Thời điểm cuối cùng nhận tin
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. BẢNG LỊCH SỬ DỮ LIỆU ĐO ĐẠC (Time-Series History)
-- Dùng để vẽ biểu đồ diễn biến thông số theo thời gian
CREATE TABLE IF NOT EXISTS telemetry_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gateway_id VARCHAR(50) NOT NULL,          -- ESP32 gửi lên
    machine_code VARCHAR(50) NOT NULL,        -- Mã máy
    status VARCHAR(20) DEFAULT 'RUNNING',     
    metrics JSON NOT NULL,                    -- Lưu linh hoạt dạng JSON: {"temperature": 45.2, ...}
    recorded_at TIMESTAMP NOT NULL,           -- Thời gian đo tại cảm biến
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian ghi vào Database
    INDEX idx_machine_time (machine_code, recorded_at DESC)
);

-- 3. BẢNG CẢNH BÁO SỰ CỐ (Alarms & Incidents)
-- Lưu trữ các sự cố bất thường để phục vụ đội bảo trì
CREATE TABLE IF NOT EXISTS alarms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_code VARCHAR(50) NOT NULL,
    alarm_type VARCHAR(50) NOT NULL,          -- OVERHEAT, OVERCURRENT, DISCONNECTED
    severity VARCHAR(20) DEFAULT 'WARNING',   -- INFO, WARNING, CRITICAL
    message TEXT NOT NULL,                    -- Mô tả sự cố
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL
);
