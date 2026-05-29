// ============================================================
// Módulo centralizado de validação para formulários do FinDash
// ============================================================

// --------------- MÁSCARAS ---------------

/** Aplica máscara dinâmica de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) */
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Aplica máscara de telefone (00) 00000-0000 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

// --------------- VALIDAÇÃO DE CPF ---------------

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false

  // Rejeita sequências repetidas (000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Cálculo do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  // Cálculo do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[10])) return false

  return true
}

// --------------- VALIDAÇÃO DE CNPJ ---------------

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false

  // Rejeita sequências repetidas
  if (/^(\d)\1{13}$/.test(digits)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  // Primeiro dígito
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i]
  }
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  if (firstDigit !== parseInt(digits[12])) return false

  // Segundo dígito
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i]
  }
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  if (secondDigit !== parseInt(digits[13])) return false

  return true
}

/** Valida CPF ou CNPJ dependendo do tamanho */
export function validateCpfCnpj(value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null } {
  const digits = value.replace(/\D/g, '')

  if (digits.length <= 11) {
    return { valid: validateCPF(value), type: 'cpf' }
  }
  return { valid: validateCNPJ(value), type: 'cnpj' }
}

// --------------- VALIDAÇÃO DE USERNAME ---------------

export function validateUsername(username: string): string | null {
  if (!username) return 'Nome de usuário é obrigatório.'
  if (username.length < 3) return 'Mínimo de 3 caracteres.'
  if (username.length > 30) return 'Máximo de 30 caracteres.'
  if (/\s/.test(username)) return 'Não pode conter espaços.'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Apenas letras, números e underscores (_).'
  return null
}

// --------------- VALIDAÇÃO DE E-MAIL ---------------

export function validateEmail(email: string): string | null {
  if (!email) return 'E-mail é obrigatório.'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!re.test(email)) return 'Formato de e-mail inválido.'
  return null
}

// --------------- VALIDAÇÃO DE SENHA ---------------

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3
  label: 'Nenhuma' | 'Fraca' | 'Média' | 'Forte'
  color: string
  percent: number
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Nenhuma', color: '#3f3f46', percent: 0 }

  let points = 0
  if (password.length >= 8) points++
  if (/[A-Z]/.test(password)) points++
  if (/[0-9]/.test(password)) points++
  if (/[^A-Za-z0-9]/.test(password)) points++

  if (points <= 1) return { score: 1, label: 'Fraca', color: '#f43f5e', percent: 33 }
  if (points <= 3) return { score: 2, label: 'Média', color: '#f59e0b', percent: 66 }
  return { score: 3, label: 'Forte', color: '#10b981', percent: 100 }
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Senha é obrigatória.'
  if (password.length < 8) return 'Mínimo de 8 caracteres.'
  if (!/[A-Z]/.test(password)) return 'Deve conter ao menos 1 letra maiúscula.'
  if (!/[0-9]/.test(password)) return 'Deve conter ao menos 1 número.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Deve conter ao menos 1 caractere especial (!@#$...).'
  return null
}

// --------------- TRADUÇÃO DE ERROS SUPABASE ---------------

const SUPABASE_ERROR_MAP: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado.',
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
  'Signup requires a valid password': 'Informe uma senha válida.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
}

export function translateSupabaseError(message: string): string {
  return SUPABASE_ERROR_MAP[message] || message
}
