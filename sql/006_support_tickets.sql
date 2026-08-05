CREATE TABLE IF NOT EXISTS noble_support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  mc_username VARCHAR(64) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open', 'in_review', 'resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES noble_users(id) ON DELETE SET NULL,
  INDEX idx_noble_support_tickets_user (user_id)
);
