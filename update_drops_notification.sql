-- Add a column to track if the notification has been sent for a drop
alter table public.drops 
add column notification_sent boolean default false;
