# ADR-002: Cơ chế Đệm Ngoại tuyến SQLite WAL & Tự động Đồng bộ Bù theo Lô

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Architecture Decision Record (ADR)  
> **Primary Owner Skill:** `documentation-and-adrs`  
> **Canonical Destination Path:** `docs/adr/ADR-002-edge-sqlite-wal-offline-sync.md`  
> **Status:** Accepted  
> **Last updated:** 2026-11-08  

---

## 1. Context & Problem Framing
- **Decision Owners:** Solution Architect & Edge Systems Lead
- **Related Requirements / Features:** `FR-SYS-012`, `FR-SYS-013`, `NFR-SYS-003`, `FEAT-OFFLINE-001`
- **Vấn đề kỹ thuật**: Tại các nhà xưởng, khu công nghiệp hoặc chi nhánh xa trung tâm, kết nối mạng nội bộ và Internet thường xuyên gặp sự cố gián đoạn (mất mạng LAN, bảo trì router, đứt cáp). Nếu trạm Kiosk phụ thuộc hoàn toàn vào kết nối mạng trực tuyến (Online-Only), việc điểm danh sẽ bị tê liệt hoàn toàn, gây ùn tắc nghiêm trọng tại cửa ra vào.
- Hệ thống đòi hỏi khả năng hoạt động ngoại tuyến độc lập ($\text{RPO} = 0$), bảo vệ dữ liệu điểm danh an toàn ngay cả khi bị mất điện đột ngột, và tự động đồng bộ bù về máy chủ khi có mạng lại.

---

## 2. Decision Drivers & Quality Attributes
- **Driver 1 (Tính sẵn sàng cao & RPO = 0)**: Không làm mất bất kỳ bản ghi điểm danh nào khi mất mạng.
- **Driver 2 (Khả năng chống hỏng hóc CSDL)**: Tệp CSDL đệm không bị hỏng (corrupted) khi thiết bị Kiosk bị ngắt nguồn đột ngột.
- **Driver 3 (Tối ưu hóa băng thông & Hiệu năng Backend)**: Gửi bù theo lô hợp lý, không làm nghẽn máy chủ khi hàng chục trạm Kiosk cùng trực tuyến trở lại.

---

## 3. Options Considered

### Option A — Đệm trong bộ nhớ RAM (In-Memory Queue)
- **Benefits:** Cực kỳ nhanh, không tốn I/O đĩa.
- **Costs & Risks:** Rủi ro mất trắng toàn bộ dữ liệu quẹt khi trạm Kiosk bị mất điện hoặc crash ứng dụng. Vi phạm nghiêm trọng chỉ tiêu $\text{RPO} = 0$.
- **Rejected.**

### Option B — Ghi tệp JSON / CSV tuần tự trên đĩa
- **Benefits:** Đơn giản, dễ đọc.
- **Costs & Risks:** Không có tính chất ACID; nguy cơ xung đột ghi (concurrency conflict) và hỏng tệp khi ứng dụng đang ghi file thì bị mất điện. Khó truy vấn trạng thái đồng bộ của từng bản ghi.
- **Rejected.**

### Option C — SQLite chế độ Write-Ahead Logging (SQLite WAL) kết hợp Worker gửi bù theo Lô
- **Benefits:**
  - SQLite là CSDL nhúng phi máy chủ (zero-configuration), dung lượng nhẹ, hiệu năng cực cao.
  - Chế độ WAL (Write-Ahead Logging) cho phép luồng đọc và luồng ghi hoạt động đồng thời không chặn nhau; cơ chế fsync đảm bảo an toàn tuyệt đối chống hỏng hóc dữ liệu khi sập nguồn đột ngột.
  - Thiết kế bảng `offline_punches` với các trường trạng thái `status: PENDING | SYNCED`, `retry_count`, `created_at`.
  - Worker đồng bộ chạy nền với cơ chế Exponential Backoff, tự động gom tối đa 50 bản ghi/lô gửi tới `/api/v1/kiosk/sync-batch`.
- **Costs & Risks:** Cần quản lý vòng đời tệp CSDL SQLite cục bộ và dọn dẹp các bản ghi đã đồng bộ thành công sau 30 ngày.

---

## 4. Chosen Decision
**Lựa chọn Option C**: Sử dụng CSDL SQLite với chế độ Write-Ahead Logging (`kiosk_local.db`) làm hàng đợi đệm ngoại tuyến cục bộ tại Kiosk, kết hợp worker đồng bộ bù theo lô tự động khi có kết nối trở lại.

---

## 5. Consequences & Impact
- **Positive Impacts:** Đảm bảo khả năng phục hồi ngoại tuyến tuyệt đối ($\text{RPO} = 0$); nhân viên điểm danh bình thường ngay cả khi mất mạng; máy chủ không bị quá tải nhờ cơ chế batching 50 records/request.
- **Negative Impacts:** Kiosk cần cấp quyền ghi thư mục cho tiến trình ứng dụng; cần có cơ chế dọn dẹp vacuum định kỳ.

---

## 6. Validation, Revisit Conditions & Review Gate
- **Empirical Validation Plan:** Thử nghiệm ngắt cáp mạng Kiosk trong 4 giờ, thực hiện 500 lượt điểm danh, sau đó tắt nguồn cưỡng bức. Bật lại thiết bị và cắm cáp mạng; kiểm chứng $100\%$ 500 bản ghi được đồng bộ toàn vẹn về PostgreSQL.
- **Revisit Triggers:** Khi số lượng bản ghi đệm cục bộ vượt quá 50,000 bản ghi.

