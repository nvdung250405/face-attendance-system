-- ==============================================================================
-- V6: Persist số lần nhập sai mã PIN (chống brute-force bền vững, không phụ thuộc RAM/JVM)
-- ==============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_failed_attempts INT NOT NULL DEFAULT 0;
