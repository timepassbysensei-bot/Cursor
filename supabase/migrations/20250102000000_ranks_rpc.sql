-- Returns a map of percentage -> rank for a published test.
-- Security: staff or students enrolled in the test's batch may call it.
create or replace function public.test_ranks(p_test_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_max numeric;
  v_batch uuid;
  result jsonb;
begin
  select t.batch_id into v_batch from public.tests t where t.id = p_test_id;
  if v_batch is null then
    return '{}'::jsonb;
  end if;

  if not (
    public.is_staff()
    or (
      public.has_role(auth.uid(), array['student'])
      and exists (
        select 1 from public.enrollments e
        where e.batch_id = v_batch and e.student_id = auth.uid() and e.status = 'active'
      )
    )
  ) then
    return '{}'::jsonb;
  end if;

  with percents as (
    select
      m.student_id,
      round((sum(m.marks_obtained) / nullif((select count(*) * t.max_marks_per_subject
        from public.tests t2 where t2.id = p_test_id), 0)) * 100, 1) as pct
    from public.marks m
    join public.tests t on t.id = m.test_id
    where m.test_id = p_test_id
      and m.is_absent = false
      and m.marks_obtained is not null
    group by m.student_id
  ),
  having_all as (
    select student_id, pct from percents
  )
  select coalesce(jsonb_object_agg(pct, rank), '{}'::jsonb)
  into result
  from (
    select pct, dense_rank() over (order by pct desc) as rank
    from (select distinct pct from having_all) d
  ) ranked;

  return result;
end;
$$;

revoke all on function public.test_ranks(uuid) from anon;
grant execute on function public.test_ranks(uuid) to authenticated;
