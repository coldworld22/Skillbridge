-- carts table
CREATE TABLE IF NOT EXISTS carts (
  user_id VARCHAR PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES carts(user_id) ON DELETE CASCADE,
  item_id VARCHAR NOT NULL,
  name VARCHAR,
  item_type VARCHAR NOT NULL DEFAULT 'class',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, item_id)
);

-- book_reviews table
CREATE TABLE IF NOT EXISTS book_reviews (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- support_attachments table
CREATE TABLE IF NOT EXISTS support_attachments (
  id SERIAL PRIMARY KEY,
  message_id UUID REFERENCES support_messages(id) ON DELETE CASCADE,
  file_url VARCHAR,
  file_name VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

