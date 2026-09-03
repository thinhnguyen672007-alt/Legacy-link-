# Legacy-link

Configuration-Driven Low-Cost Gateway for Legacy Equipment

> **Current Branch:** `feature/infra-base`  
> **Focus:** Initial Infrastructure Foundation (Docker & Mosquitto MQTT)

---

## English

### About This Branch (`feature/infra-base`)
The `feature/infra-base` branch establishes the initial infrastructure foundation for the **Legacy-link** project.

While other team members develop the ESP32 gateway firmware (`firmware/`), backend services (`backend/`), and operator interfaces (`frontend/`), this branch provides a clean, containerized Docker environment and message broker that connects all components together.

### Key Deliverables on This Branch
- **Docker Compose Setup**: Unified service orchestration for local development and testing.
- **Mosquitto MQTT Broker**: Central communication bus for telemetry published by the ESP32 gateway and consumed by backend services or simulators.
- **Authentication & Security**: Secure MQTT configuration with username/password authentication, anonymous access disabled, and sensitive credentials excluded from Git.
- **Organized Structure**: Clear separation between static configurations, runtime data, logs, and helper scripts.

For detailed setup, commands, and configuration guides, see the [Infrastructure Documentation](infrastructure/README.md).

---

## Tiếng Việt

### Giới thiệu về nhánh này (`feature/infra-base`)
Nhánh `feature/infra-base` chịu trách nhiệm xây dựng nền tảng hạ tầng cơ sở ban đầu cho dự án **Legacy-link**.

Trong khi các thành viên khác tập trung phát triển firmware cho ESP32 (`firmware/`), các dịch vụ backend (`backend/`), và giao diện người dùng (`frontend/`), nhánh này cung cấp môi trường Docker hóa và hệ thống Message Broker trung gian để kết nối tất cả các thành phần lại với nhau.

### Các hạng mục chính trên nhánh
- **Cấu hình Docker Compose**: Quản lý và điều phối các dịch vụ hạ tầng tập trung cho môi trường phát triển cục bộ.
- **Mosquitto MQTT Broker**: Kênh truyền thông điệp trung tâm tiếp nhận dữ liệu cảm biến/Modbus từ ESP32 gateway và phân phối tới backend hoặc các trình giả lập.
- **Bảo mật & Xác thực**: Thiết lập MQTT an toàn yêu cầu tài khoản/mật khẩu, vô hiệu hóa truy cập ẩn danh (anonymous), và bảo vệ tuyệt đối các thông tin nhạy cảm khỏi Git.
- **Cấu trúc tổ chức chuẩn**: Tách bạch rõ ràng giữa file cấu hình tĩnh, dữ liệu thực thi (runtime data), nhật ký (logs), và các kịch bản tiện ích.

Để xem hướng dẫn chi tiết cách cấu hình, khởi chạy và mở rộng hạ tầng, vui lòng xem [Tài liệu Hạ tầng (infrastructure/README.md)](infrastructure/README.md).
