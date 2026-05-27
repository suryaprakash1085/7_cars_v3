-- Create UDV Items table
CREATE TABLE IF NOT EXISTS udv_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(50) NOT NULL COMMENT 'Entity type (leads, inventory, etc)',
  file_name VARCHAR(255) NOT NULL,
  data_json LONGTEXT NOT NULL COMMENT 'JSON data of the uploaded row',
  status ENUM('added', 'duplicate', 'failed', 'updated') NOT NULL DEFAULT 'added',
  failure_reason VARCHAR(500) COMMENT 'Reason for failure if status is failed',
  unique_key_hash VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hash of unique fields for duplicate detection',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity),
  INDEX idx_status (status),
  INDEX idx_unique_key_hash (unique_key_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
