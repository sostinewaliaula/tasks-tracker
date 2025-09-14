-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

-- Update users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS ldap_uid VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_ldap_uid ON users(ldap_uid);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();