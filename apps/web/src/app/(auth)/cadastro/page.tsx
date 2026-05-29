'use client'

import { useState, useCallback, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  maskCpfCnpj,
  maskPhone,
  validateUsername,
  validateEmail,
  validateCpfCnpj,
  validatePassword,
  getPasswordStrength,
  translateSupabaseError,
  type PasswordStrength,
} from '@/lib/validators'

// ============================================================
// Tipos do formulário
// ============================================================
interface FormFields {
  username: string
  nome: string
  documento: string
  email: string
  telefone: string
  senha: string
  confirmarSenha: string
}

type FormErrors = Partial<Record<keyof FormFields, string>>

const INITIAL_FIELDS: FormFields = {
  username: '',
  nome: '',
  documento: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
}

// ============================================================
// Componente: Ícone de Olho (toggle visibilidade de senha)
// ============================================================
function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

// ============================================================
// Componente: Indicador de Força da Senha
// ============================================================
function PasswordStrengthBar({ strength }: { strength: PasswordStrength }) {
  if (strength.score === 0) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
        />
      </div>
      <p className="text-xs font-medium" style={{ color: strength.color }}>
        Força: {strength.label}
      </p>
    </div>
  )
}

// ============================================================
// Componente: Spinner de Loading
// ============================================================
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ============================================================
// Estilos reutilizáveis
// ============================================================
const INPUT_BASE = 'w-full bg-[#0f1420] border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-all text-sm'
const INPUT_NORMAL = `${INPUT_BASE} border-white/10 focus:border-indigo-500 focus:ring-indigo-500`
const INPUT_ERROR = `${INPUT_BASE} border-red-500/50 focus:border-red-500 focus:ring-red-500`

// ============================================================
// Página de Cadastro
// ============================================================
export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS)
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const passwordStrength = getPasswordStrength(fields.senha)

  // --------------- Helpers ---------------

  const updateField = (name: keyof FormFields, value: string) => {
    setFields(prev => ({ ...prev, [name]: value }))
    // Limpa o erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (globalError) setGlobalError(null)
  }

  const handleMaskedChange = (name: keyof FormFields, value: string, maskFn: (v: string) => string) => {
    updateField(name, maskFn(value))
  }

  // --------------- Validação por Campo (onBlur) ---------------

  const validateField = useCallback((name: keyof FormFields) => {
    let error: string | null = null

    switch (name) {
      case 'username':
        error = validateUsername(fields.username)
        break
      case 'nome':
        error = !fields.nome.trim() ? 'Nome / Razão Social é obrigatório.' : null
        break
      case 'documento': {
        const digits = fields.documento.replace(/\D/g, '')
        if (!digits) {
          error = 'CPF ou CNPJ é obrigatório.'
        } else if (digits.length < 11) {
          error = 'CPF incompleto. Informe 11 dígitos.'
        } else if (digits.length > 11 && digits.length < 14) {
          error = 'CNPJ incompleto. Informe 14 dígitos.'
        } else {
          const result = validateCpfCnpj(fields.documento)
          if (!result.valid) {
            error = result.type === 'cpf' ? 'CPF inválido.' : 'CNPJ inválido.'
          }
        }
        break
      }
      case 'email':
        error = validateEmail(fields.email)
        break
      case 'senha':
        error = validatePassword(fields.senha)
        break
      case 'confirmarSenha':
        if (!fields.confirmarSenha) {
          error = 'Confirme sua senha.'
        } else if (fields.confirmarSenha !== fields.senha) {
          error = 'As senhas não conferem.'
        }
        break
    }

    setErrors(prev => {
      const next = { ...prev }
      if (error) {
        next[name] = error
      } else {
        delete next[name]
      }
      return next
    })
  }, [fields])

  // --------------- Validação Completa ---------------

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {}

    const usernameErr = validateUsername(fields.username)
    if (usernameErr) newErrors.username = usernameErr

    if (!fields.nome.trim()) newErrors.nome = 'Nome / Razão Social é obrigatório.'

    const digits = fields.documento.replace(/\D/g, '')
    if (!digits) {
      newErrors.documento = 'CPF ou CNPJ é obrigatório.'
    } else {
      const result = validateCpfCnpj(fields.documento)
      if (!result.valid) {
        newErrors.documento = result.type === 'cpf' ? 'CPF inválido.' : 'CNPJ inválido.'
      }
    }

    const emailErr = validateEmail(fields.email)
    if (emailErr) newErrors.email = emailErr

    const senhaErr = validatePassword(fields.senha)
    if (senhaErr) newErrors.senha = senhaErr

    if (!fields.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha.'
    } else if (fields.confirmarSenha !== fields.senha) {
      newErrors.confirmarSenha = 'As senhas não conferem.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --------------- Estado do Botão ---------------

  const hasErrors = Object.keys(errors).length > 0
  const hasEmptyRequired = !fields.username || !fields.nome || !fields.documento || !fields.email || !fields.senha || !fields.confirmarSenha
  const isButtonDisabled = hasErrors || hasEmptyRequired || loading

  // --------------- Submit ---------------

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError(null)

    if (!validateAll()) return

    setLoading(true)

    try {
      // Passo 1 — Criar o usuário de autenticação no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.senha,
        options: {
          data: {
            username: fields.username,
            nome: fields.nome,
            documento: fields.documento.replace(/\D/g, ''),
            telefone: fields.telefone.replace(/\D/g, ''),
          },
        },
      })

      if (authError) {
        setGlobalError(translateSupabaseError(authError.message))
        setLoading(false)
        return
      }

      if (!data.user) {
        setGlobalError('Erro inesperado: usuário não foi criado.')
        setLoading(false)
        return
      }

      // Passo 2 — Inserir o perfil na tabela `usuarios`
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert([{
          id: data.user.id,
          username: fields.username,
          nome: fields.nome,
          documento: fields.documento.replace(/\D/g, ''),
          email: fields.email,
          telefone: fields.telefone.replace(/\D/g, '') || null,
          criado_em: new Date().toISOString(),
        }])

      if (profileError) {
        // Se falhou ao inserir o perfil, informamos o usuário.
        // Não podemos usar admin.deleteUser() no frontend (requer service_role).
        console.error('Erro ao criar perfil:', profileError)

        if (profileError.message.includes('unique') || profileError.message.includes('duplicate')) {
          setGlobalError('Este nome de usuário já está cadastrado.')
        } else {
          setGlobalError('Erro ao salvar perfil. Tente novamente ou entre em contato com o suporte.')
        }
        setLoading(false)
        return
      }

      // Sucesso — Redireciona para o login com mensagem
      router.push('/login?success=' + encodeURIComponent('Conta criada com sucesso! Faça login para continuar.'))
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setGlobalError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-[#080b14] flex text-white font-sans">
      {/* Lado Esquerdo - Decorativo */}
      <div className="hidden lg:flex w-[45%] relative bg-gradient-to-br from-[#0f1420] to-[#080b14] border-r border-white/5 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-1/6 left-1/3 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] mix-blend-screen" />
        </div>

        <div className="relative z-10 p-12 max-w-xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Login
          </Link>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">FinDash</h1>
          <p className="text-xl text-white/60 mb-8 leading-relaxed">
            Crie sua conta e comece a centralizar suas finanças com inteligência. Conecte bancos, categorize gastos e projete seu futuro.
          </p>
          <div className="flex gap-4">
            <div className="h-2 w-2 bg-white/10 rounded-full" />
            <div className="h-2 w-16 bg-indigo-500 rounded-full" />
            <div className="h-2 w-2 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-20 py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header mobile */}
          <div className="lg:hidden mb-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Login
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Criar Conta</h2>
            <p className="text-white/60">Preencha os dados abaixo para começar</p>
          </div>

          {/* Erro Global */}
          {globalError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-username">
                Nome de Usuário <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                value={fields.username}
                onChange={(e) => updateField('username', e.target.value.replace(/\s/g, ''))}
                onBlur={() => validateField('username')}
                className={errors.username ? INPUT_ERROR : INPUT_NORMAL}
                placeholder="ex: lucas_dev"
                autoComplete="username"
              />
              {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
            </div>

            {/* Nome / Razão Social */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-nome">
                Nome / Razão Social <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-nome"
                type="text"
                value={fields.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                onBlur={() => validateField('nome')}
                className={errors.nome ? INPUT_ERROR : INPUT_NORMAL}
                placeholder="Como devemos te chamar?"
                autoComplete="name"
              />
              {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
            </div>

            {/* CPF / CNPJ */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-documento">
                CPF / CNPJ <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-documento"
                type="text"
                inputMode="numeric"
                value={fields.documento}
                onChange={(e) => handleMaskedChange('documento', e.target.value, maskCpfCnpj)}
                onBlur={() => validateField('documento')}
                className={errors.documento ? INPUT_ERROR : INPUT_NORMAL}
                placeholder="000.000.000-00"
              />
              {errors.documento && <p className="text-xs text-red-400 mt-1">{errors.documento}</p>}
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-email">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={fields.email}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => validateField('email')}
                className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-telefone">
                Telefone / Celular <span className="text-white/30 text-xs">(opcional)</span>
              </label>
              <input
                id="reg-telefone"
                type="tel"
                inputMode="numeric"
                value={fields.telefone}
                onChange={(e) => handleMaskedChange('telefone', e.target.value, maskPhone)}
                className={INPUT_NORMAL}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-senha">
                Senha <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-senha"
                  type={showSenha ? 'text' : 'password'}
                  value={fields.senha}
                  onChange={(e) => updateField('senha', e.target.value)}
                  onBlur={() => validateField('senha')}
                  className={`${errors.senha ? INPUT_ERROR : INPUT_NORMAL} pr-12`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showSenha} />
                </button>
              </div>
              <PasswordStrengthBar strength={passwordStrength} />
              {errors.senha && <p className="text-xs text-red-400 mt-1">{errors.senha}</p>}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80" htmlFor="reg-confirmar-senha">
                Confirmar Senha <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-confirmar-senha"
                  type={showConfirmar ? 'text' : 'password'}
                  value={fields.confirmarSenha}
                  onChange={(e) => updateField('confirmarSenha', e.target.value)}
                  onBlur={() => validateField('confirmarSenha')}
                  className={`${errors.confirmarSenha ? INPUT_ERROR : INPUT_NORMAL} pr-12`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showConfirmar} />
                </button>
              </div>
              {errors.confirmarSenha && <p className="text-xs text-red-400 mt-1">{errors.confirmarSenha}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>

            {/* Link para login */}
            <p className="text-center text-white/40 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
