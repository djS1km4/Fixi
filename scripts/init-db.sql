-- Database initialization script for Fixi
-- This script runs when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These indexes will be created by TypeORM entities, but we can optimize them manually

-- Users table indexes (will be created by entities)
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- Services table indexes
-- CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
-- CREATE INDEX IF NOT EXISTS idx_services_technician ON services(technician_id);
-- CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
-- CREATE INDEX IF NOT EXISTS idx_services_location ON services USING GIST(location);

-- Orders table indexes
-- CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_technician ON orders(technician_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Payments table indexes
-- CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
-- CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
-- CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Initialize default data
-- Insert default categories
INSERT INTO categories (id, name, description, icon_url, is_active) VALUES
('cat-rep-computadoras', 'Reparación de Computadores', 'Reparación de hardware y software de computadores', '/icons/computer.svg', true),
('cat-rep-celulares', 'Reparación de Celulares', 'Reparación de móviles y tablets', '/icons/mobile.svg', true),
('cat-soporte-remoto', 'Soporte Remoto', 'Asistencia técnica a distancia', '/icons/remote.svg', true),
('cat-instalacion', 'Instalación', 'Instalación de software y equipos', '/icons/install.svg', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default services
INSERT INTO services (id, category_id, name, description, base_price, estimated_duration, icon_url, is_active) VALUES
('srv-cambio-pantalla', 'cat-rep-celulares', 'Cambio de Pantalla', 'Reemplazo de pantalla rota o dañada', 150000, 60, '/icons/screen.svg', true),
('srv-cambio-bateria', 'cat-rep-celulares', 'Cambio de Batería', 'Reemplazo de batería con poca duración', 80000, 45, '/icons/battery.svg', true),
('srv-formateo-limpieza', 'cat-rep-computadores', 'Formateo y Limpieza', 'Formateo y optimización de sistema operativo', 50000, 120, '/icons/clean.svg', true),
('srv-eliminacion-virus', 'cat-rep-computadores', 'Eliminación de Virus', 'Detección y eliminación de malware', 70000, 90, '/icons/virus.svg', true),
('srv-recuperacion-datos', 'cat-rep-computadores', 'Recuperación de Datos', 'Recuperación de archivos perdidos', 120000, 180, '/icons/recovery.svg', true),
('srv-instalacion-office', 'cat-instalacion', 'Instalación Office', 'Instalación y configuración de Microsoft Office', 30000, 60, '/icons/office.svg', true)
ON CONFLICT (id) DO NOTHING;

-- Create initial admin user (password will be hashed)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_verified, is_active, created_at, updated_at) VALUES
(
    uuid_generate_v4(),
    'admin@fixi.co',
    '$2b$10$placeholder_hash_will_be_replaced_in_code', -- This should be properly hashed
    'Admin',
    'Fixi',
    'ADMIN',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Set up sequences for auto-incrementing IDs
-- TypeORM will handle this, but keeping as reference

-- Create stored procedures for common operations
CREATE OR REPLACE FUNCTION calculate_service_rating(technician_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM orders
    WHERE technician_id = technician_uuid
      AND status = 'COMPLETED'
      AND customer_rating IS NOT NULL;

    RETURN ROUND(avg_rating, 2);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log database initialization
DO $$
BEGIN
    RAISE NOTICE 'Fixi database initialized successfully on %', NOW();
END $$;