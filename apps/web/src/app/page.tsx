import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/login')
  }

  // Pegamos o token do Supabase para fazer a requisição no nosso próprio backend Fastify depois
  // const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <div className="min-h-screen bg-[#080b14] text-white p-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <h1 className="text-3xl font-bold font-sans">FinDash</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            Logado como: <strong className="text-white">{user.email}</strong>
          </span>
          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors">
              Sair
            </button>
          </form>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto mt-12">
        <div className="p-8 bg-[#0f1420] border border-white/10 rounded-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Autenticação Concluída com Sucesso!</h2>
          <p className="text-white/60 mb-8 max-w-lg">
            Você está logado e o Middleware do Next.js está protegendo esta rota.
            O próximo passo é construir a integração com a API Fastify para puxar os dados do banco.
          </p>
        </div>
      </main>
    </div>
  )
}

