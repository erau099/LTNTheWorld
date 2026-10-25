CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL UNIQUE,
    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id) REFERENCES logins(id)
);
