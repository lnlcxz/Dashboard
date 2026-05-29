import { login } from './actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se já estiver logado, manda pro dashboard
  if (user) {
    return redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#080b14] flex text-white font-sans">
      {/* Lado Esquerdo - Decorativo */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#0f1420] to-[#080b14] border-r border-white/5 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" />
        </div>
        
        <div className="relative z-10 p-12 max-w-xl">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">FinDash</h1>
          <p className="text-xl text-white/60 mb-8 leading-relaxed">
            Seu dashboard financeiro inteligente integrado ao Open Finance Brasil. Centralize, categorize e projete seu futuro.
          </p>
          <div className="flex gap-4">
            <div className="h-2 w-16 bg-indigo-500 rounded-full" />
            <div className="h-2 w-2 bg-white/10 rounded-full" />
            <div className="h-2 w-2 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo(a)</h2>
            <p className="text-white/60">Acesse sua conta para continuar</p>
          </div>

          {/* Mensagem de sucesso (vinda do cadastro) */}
          {searchParams?.success && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {searchParams.success}
            </div>
          )}

          {/* Mensagem de erro */}
          {searchParams?.error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {searchParams.error}
            </div>
          )}

          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-[#0f1420] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="voce@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full bg-[#0f1420] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              formAction={login}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium transition-colors"
            >
              Entrar
            </button>

            <p className="text-center text-white/40 text-sm">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

