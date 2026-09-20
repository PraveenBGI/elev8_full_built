-- Phase 0.5 -- State Cluster: add is_active to states.
--
-- Source: elev8-country-admin-config_3.html's State Cluster section --
-- "Deactivate a state to keep it configured but hidden from public
-- matching" (the mockup's own note). is_thrust_cluster already existed
-- on states (foundation migration); is_active did not.
--
-- Rollback: alter table public.states drop column if exists is_active;

alter table public.states add column is_active boolean not null default true;
