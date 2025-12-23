-- Atualizar as funções para usar os novos valores do enum

CREATE OR REPLACE FUNCTION public.user_can_view_app_data()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT public.user_has_any_role(ARRAY['admin','manager','supervisor','assistent']::app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.user_can_manage_app_data()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT public.user_has_any_role(ARRAY['admin','manager','supervisor']::app_role[]);
$function$;