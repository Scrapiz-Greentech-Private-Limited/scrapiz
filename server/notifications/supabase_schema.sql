-- =====================================================
-- Supabase Schema for Order Notifications
-- =====================================================
-- This SQL script creates the order_notifications table
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create the notifications table
CREATE TABLE IF NOT EXISTS order_notifications (
    id BIGSERIAL PRIMARY KEY,
    
    -- Order reference (from Django database)
    order_no_id INTEGER NOT NULL,
    order_number VARCHAR(20) NOT NULL,
    
    -- Notification details
    notification_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    recipient VARCHAR(255) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    last_retry_at TIMESTAMPTZ,
    
    -- Error tracking
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    
    -- Flexible metadata storage
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT chk_notification_type CHECK (notification_type IN ('EMAIL', 'WHATSAPP', 'DASHBOARD')),
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_no 
    ON order_notifications(order_no_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_order_notifications_status 
    ON order_notifications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_notifications_created 
    ON order_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_notifications_order_number 
    ON order_notifications(order_number);

-- Enable Row Level Security (optional, for future admin dashboard)
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access" 
    ON order_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Optional: Create policy for authenticated users (read-only)
-- Uncomment if you want authenticated users to read notifications
-- CREATE POLICY "Authenticated users can read notifications" 
--     ON order_notifications
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- Add comment to table
COMMENT ON TABLE order_notifications IS 'Stores notification records for order management system';

-- Add comments to columns
COMMENT ON COLUMN order_notifications.order_no_id IS 'Foreign key reference to Django OrderNo.id';
COMMENT ON COLUMN order_notifications.notification_type IS 'Type of notification: EMAIL, WHATSAPP, or DASHBOARD';
COMMENT ON COLUMN order_notifications.status IS 'Current status: PENDING, SENT, FAILED, or READ';
COMMENT ON COLUMN order_notifications.metadata IS 'Flexible JSON storage for additional notification data';

-- =====================================================
-- Sample Queries for Testing
-- =====================================================

-- Get all notifications for an order
-- SELECT * FROM order_notifications WHERE order_no_id = 1;

-- Get unread dashboard notifications
-- SELECT * FROM order_notifications 
-- WHERE notification_type = 'DASHBOARD' 
-- AND status IN ('PENDING', 'SENT')
-- ORDER BY created_at DESC;

-- Get failed notifications that can be retried
-- SELECT * FROM order_notifications 
-- WHERE status = 'FAILED' 
-- AND retry_count < 3
-- ORDER BY created_at DESC;

-- Get notification statistics
-- SELECT 
--     notification_type,
--     status,
--     COUNT(*) as count
-- FROM order_notifications
-- GROUP BY notification_type, status
-- ORDER BY notification_type, status;
