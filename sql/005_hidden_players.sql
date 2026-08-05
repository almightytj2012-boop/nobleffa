-- Lets admins permanently pull a player off the public leaderboards
-- (e.g. known bots) without it getting undone the next time NobleSync
-- syncs and recreates the row. Deleting a noble_players row outright
-- doesn't stick — NobleSync just re-inserts it next sync if the account
-- is still active in-game. Hidden players stay in the table (so their
-- stats aren't lost) but never show up in /api/leaderboard or the public
-- rankings/leaderboards pages.
ALTER TABLE noble_players
  ADD COLUMN IF NOT EXISTS hidden TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE noble_players
  ADD INDEX IF NOT EXISTS idx_noble_players_hidden (hidden);
