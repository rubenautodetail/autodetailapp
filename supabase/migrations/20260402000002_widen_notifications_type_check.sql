-- Widen the notification type CHECK constraint to include cron job types.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'info', 'success', 'warning', 'error',
    'admin.job_unaccepted', 'contractor.job_reminder', 'contractor.job_assigned',
    'approval_reminder_1', 'approval_reminder_2', 'approval_reminder_3', 'approval_reminder_4'
  ]));
