-- Adds accounts, sessions, store orders and site settings on top of the
-- existing stats-plugin tables (noble_players, noble_uhc_elo, noble_sword_elo,
-- noble_dpot_elo). Safe to run multiple times.

CREATE TABLE IF NOT EXISTS noble_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(32) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS noble_sessions (
  token      CHAR(64) PRIMARY KEY,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES noble_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS noble_orders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  rank_id           VARCHAR(32) NOT NULL,
  rank_name         VARCHAR(32) NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  status            ENUM('pending', 'paid', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES noble_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS noble_settings (
  `key`   VARCHAR(64) PRIMARY KEY,
  `value` TEXT
) ENGINE=InnoDB;

-- The very first account created on the site is auto-promoted to admin by
-- the /api/auth/register handler, so no manual SQL is needed to bootstrap
-- an admin. If you ever need to promote someone by hand:
-- UPDATE noble_users SET role = 'admin' WHERE username = 'YourName';
