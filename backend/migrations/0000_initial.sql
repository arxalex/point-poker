-- Migration number: 0000
-- Initial schema for Point Poker tables

DROP TABLE IF EXISTS pp_members;
CREATE TABLE pp_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pass TEXT,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT
);

DROP TABLE IF EXISTS pp_sessions;
CREATE TABLE pp_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pass TEXT NOT NULL,
    data TEXT
);

DROP TABLE IF EXISTS pp_link;
CREATE TABLE pp_link (
    id INTEGER NOT NULL,
    pass TEXT NOT NULL,
    memberid INTEGER NOT NULL,
    linkid INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    rate INTEGER,
    FOREIGN KEY (id) REFERENCES pp_sessions(id),
    FOREIGN KEY (memberid) REFERENCES pp_members(id)
);

CREATE INDEX idx_link_id ON pp_link(id);
CREATE INDEX idx_link_memberid ON pp_link(memberid);
CREATE INDEX idx_link_pass ON pp_link(pass);