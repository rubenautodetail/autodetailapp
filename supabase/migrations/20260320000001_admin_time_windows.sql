-- Create time_windows table for admin-configurable booking time slots

CREATE TABLE IF NOT EXISTS time_windows (
    id SERIAL PRIMARY KEY,
    slot VARCHAR(5) NOT NULL UNIQUE, -- HH:MM format (24-hour)
    label VARCHAR(50) NOT NULL, -- English label (e.g., "9:00 AM")
    label_es VARCHAR(50), -- Spanish label
    range VARCHAR(50), -- English range display (e.g., "9:00 AM")
    range_es VARCHAR(50), -- Spanish range display
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE time_windows ENABLE ROW LEVEL SECURITY;

-- Create policy for admins (using service role bypass)
CREATE POLICY "Admins can manage time windows"
ON time_windows
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default time windows (matching current hardcoded values)
INSERT INTO time_windows (slot, label, label_es, range, range_es, is_active, sort_order) VALUES
('09:00', '9:00 AM', '9:00 AM', '9:00 AM', '9:00 AM', true, 1),
('10:00', '10:00 AM', '10:00 AM', '10:00 AM', '10:00 AM', true, 2),
('11:00', '11:00 AM', '11:00 AM', '11:00 AM', '11:00 AM', true, 3),
('12:00', '12:00 PM', '12:00 PM', '12:00 PM', '12:00 PM', true, 4),
('13:00', '1:00 PM', '1:00 PM', '1:00 PM', '1:00 PM', true, 5),
('14:00', '2:00 PM', '2:00 PM', '2:00 PM', '2:00 PM', true, 6),
('15:00', '3:00 PM', '3:00 PM', '3:00 PM', '3:00 PM', true, 7),
('16:00', '4:00 PM', '4:00 PM', '4:00 PM', '4:00 PM', true, 8)
ON CONFLICT (slot) DO NOTHING;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_time_windows_sort_order ON time_windows(sort_order);
CREATE INDEX IF NOT EXISTS idx_time_windows_active ON time_windows(is_active) WHERE is_active = true;