import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Valida que quem chama é gestor
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await sb.auth.getUser(token!)
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })

  const { data: perfil } = await sb.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'gestor') return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: corsHeaders })

  const { nome, email, senha } = await req.json()

  // Cria usuário no auth
  const { data: newUser, error: authErr } = await sb.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authErr) return new Response(JSON.stringify({ error: authErr.message }), { headers: corsHeaders })

  // Cria perfil
  await sb.from('perfis').insert({ id: newUser.user.id, nome, email, role: 'vendedor' })

  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
})
