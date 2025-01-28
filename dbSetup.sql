--- Setup script is loaded every time the bot starts to create the tables if they don't exist already ---
CREATE TABLE if not exists `quotes`
(
    `id`            INTEGER PRIMARY KEY AUTOINCREMENT,
    `quote_text`    TEXT NOT NULL,
    `creation_date` TEXT,
    `alias`         TEXT
);

CREATE TABLE if not exists `commands`
(
    `name`             TEXT    NOT NULL,
    `response`         TEXT    NOT NULL DEFAULT '',
    `channel_cooldown` INTEGER NOT NULL DEFAULT 15,
    `user_cooldown`    INTEGER NOT NULL DEFAULT 15,
    `mod_only`         INTEGER NOT NULL DEFAULT 0,
    `broadcaster_only` INTEGER NOT NULL DEFAULT 0,
    `enabled`          INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (name)
    );
