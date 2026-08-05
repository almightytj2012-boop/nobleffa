-- Adds email verification and Minecraft-account linking on top of
-- noble_users. Safe to run multiple times.

ALTER TABLE noble_users
  ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mc_uuid CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS mc_username VARCHAR(16) NULL;

-- A Minecraft account can only ever be linked to one website account.
ALTER TABLE noble_users
  ADD UNIQUE KEY IF NOT EXISTS uniq_noble_users_mc_uuid (mc_uuid);

CREATE TABLE IF NOT EXISTS noble_email_verifications (
  token      CHAR(64) PRIMARY KEY,
  user_id    INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES noble_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One-time 6-character codes. A player runs `/noblelink <code>` in-game;
-- NobleSync (or another Bukkit plugin with DB access) fills in
-- claimed_uuid/claimed_username/claimed_at for that code. The website then
-- polls for the claim and, once it appears, links mc_uuid/mc_username onto
-- the noble_users row that generated the code.
CREATE TABLE IF NOT EXISTS noble_mc_link_codes (
  code             CHAR(6) PRIMARY KEY,
  user_id          INT NOT NULL,
  claimed_uuid     CHAR(36) NULL,
  claimed_username VARCHAR(16) NULL,
  claimed_at       TIMESTAMP NULL,
  expires_at       TIMESTAMP NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES noble_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Existing accounts created before verification existed are treated as
-- already-verified by email so nobody gets logged out or loses access —
-- only new signups are required to click the verification link.
UPDATE noble_users SET email_verified = 1 WHERE created_at < NOW();
