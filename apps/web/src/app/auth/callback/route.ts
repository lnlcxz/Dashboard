import { NextResponse } from 'next/server'
// A rota está mudada para `@/utils/supabase/server` usando o alias import
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // se houver 'next' redirect pra ele após o login
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // retornar pra login em caso de erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
