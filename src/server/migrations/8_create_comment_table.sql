CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    users_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    node_id INTEGER REFERENCES node(id) ON DELETE CASCADE,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL
);
