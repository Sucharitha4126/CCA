import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Home,
  Landmark,
  LockKeyhole,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { currency } from '../utils/format.js'

const steps = ['Personal', 'Bank', 'Security']

const initialForm = {
  full_name: '',
  email: '',
  phone_number: '',
  address: '',
  dob: '',
  account_number: '',
  ifsc_code: '',
  bank_name: '',
  branch_name: '',
  account_type: 'Savings',
  initial_balance: '25000',
  pan_number: '',
  password: '',
  confirm_password: '',
}

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const preview = useMemo(() => ({
    holder: form.full_name || 'Account holder',
    account: form.account_number || 'Pending account number',
    bank: form.bank_name || 'Bank name',
    branch: form.branch_name || 'Branch',
    type: form.account_type,
    balance: currency(form.initial_balance),
  }), [form])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validate(values = form) {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[0-9+\-\s()]{8,30}$/
    const accountPattern = /^[A-Za-z0-9-]{6,40}$/
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/
    const balance = Number(values.initial_balance)

    if (!values.full_name.trim()) nextErrors.full_name = 'Full name is required.'
    if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!phonePattern.test(values.phone_number.trim())) nextErrors.phone_number = 'Enter a valid phone number.'
    if (!values.address.trim() || values.address.trim().length < 8) nextErrors.address = 'Enter a complete address.'
    if (!values.dob) nextErrors.dob = 'Date of birth is required.'

    if (!accountPattern.test(values.account_number.trim())) nextErrors.account_number = 'Use 6-40 letters, numbers, or hyphens.'
    if (!ifscPattern.test(values.ifsc_code.trim().toUpperCase())) nextErrors.ifsc_code = 'Use a valid IFSC format, for example HDFC0001234.'
    if (!values.bank_name.trim()) nextErrors.bank_name = 'Bank name is required.'
    if (!values.branch_name.trim()) nextErrors.branch_name = 'Branch name is required.'
    if (!['Savings', 'Current'].includes(values.account_type)) nextErrors.account_type = 'Choose Savings or Current.'
    if (!Number.isFinite(balance) || balance < 1000) nextErrors.initial_balance = 'Initial balance must be at least ₹1,000.'
    if (!panPattern.test(values.pan_number.trim().toUpperCase())) nextErrors.pan_number = 'Use a valid PAN format, for example ABCDE1234F.'

    if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (values.confirm_password !== values.password) nextErrors.confirm_password = 'Passwords must match.'

    return nextErrors
  }

  function stepKeys(index = step) {
    if (index === 0) return ['full_name', 'email', 'phone_number', 'address', 'dob']
    if (index === 1) return ['account_number', 'ifsc_code', 'bank_name', 'branch_name', 'account_type', 'initial_balance', 'pan_number']
    return ['password', 'confirm_password']
  }

  function validateStep(index = step) {
    const allErrors = validate()
    const scopedErrors = Object.fromEntries(Object.entries(allErrors).filter(([key]) => stepKeys(index).includes(key)))
    setErrors((current) => ({ ...current, ...scopedErrors }))
    return Object.keys(scopedErrors).length === 0
  }

  function next() {
    if (!validateStep(step)) {
      toast.error('Complete this section before continuing')
      return
    }
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function submit(event) {
    event.preventDefault()
    const allErrors = validate()
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) {
      const firstError = Object.keys(allErrors)[0]
      const nextStep = steps.findIndex((_, index) => stepKeys(index).includes(firstError))
      if (nextStep >= 0) setStep(nextStep)
      toast.error('Fix the highlighted fields before creating your account')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        initial_balance: Number(form.initial_balance),
        ifsc_code: form.ifsc_code.toUpperCase(),
        pan_number: form.pan_number.toUpperCase(),
      }
      console.log('[register-page] create account clicked', { email: payload.email, account_number: payload.account_number })
      await register(payload)
      toast.success('Account Created Successfully')
      navigate('/dashboard')
    } catch (error) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : detail
      toast.error(message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 grid-bg">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <form onSubmit={submit} className="glass rounded-lg p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-md border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                <ShieldCheck />
              </div>
              <p className="text-sm text-cyan-200">Kavach onboarding</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Open a bank account</h1>
            </div>
            <Link className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900" to="/login">Login</Link>
          </div>

          <div className="mb-7 grid gap-3 sm:grid-cols-3">
            {steps.map((label, index) => (
              <button key={label} type="button" onClick={() => setStep(index)} disabled={loading} className={`rounded-md border px-3 py-3 text-left transition ${index === step ? 'border-cyan-300/60 bg-cyan-300/10 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400'}`}>
                <span className="text-xs">Step {index + 1}</span>
                <span className="mt-1 flex items-center gap-2 font-semibold"><CheckCircle2 size={16} /> {label}</span>
              </button>
            ))}
          </div>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={UserRound} label="Full Name" value={form.full_name} error={errors.full_name} onChange={(value) => update('full_name', value)} />
              <Field icon={Mail} label="Email" value={form.email} error={errors.email} onChange={(value) => update('email', value)} type="email" />
              <Field icon={Phone} label="Phone Number" value={form.phone_number} error={errors.phone_number} onChange={(value) => update('phone_number', value)} />
              <Field icon={CalendarDays} label="Date of Birth" value={form.dob} error={errors.dob} onChange={(value) => update('dob', value)} type="date" />
              <div className="sm:col-span-2">
                <Field icon={Home} label="Address" value={form.address} error={errors.address} onChange={(value) => update('address', value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={CreditCard} label="Account Number" value={form.account_number} error={errors.account_number} onChange={(value) => update('account_number', value)} />
              <Field icon={Landmark} label="IFSC Code" value={form.ifsc_code} error={errors.ifsc_code} onChange={(value) => update('ifsc_code', value.toUpperCase())} placeholder="HDFC0001234" />
              <Field icon={Building2} label="Bank Name" value={form.bank_name} error={errors.bank_name} onChange={(value) => update('bank_name', value)} />
              <Field icon={Landmark} label="Branch Name" value={form.branch_name} error={errors.branch_name} onChange={(value) => update('branch_name', value)} />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Account Type</span>
                <select className="input" value={form.account_type} onChange={(event) => update('account_type', event.target.value)} disabled={loading}>
                  <option>Savings</option>
                  <option>Current</option>
                </select>
                {errors.account_type && <p className="mt-2 text-xs text-rose-300">{errors.account_type}</p>}
              </label>
              <Field icon={Banknote} label="Initial Account Balance" value={form.initial_balance} error={errors.initial_balance} onChange={(value) => update('initial_balance', value)} type="number" min="1000" placeholder="₹10,000" hint={currency(form.initial_balance)} />
              <div className="sm:col-span-2">
                <Field icon={BadgeCheck} label="PAN Card Number" value={form.pan_number} error={errors.pan_number} onChange={(value) => update('pan_number', value.toUpperCase())} placeholder="ABCDE1234F" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={LockKeyhole} label="Password" value={form.password} error={errors.password} onChange={(value) => update('password', value)} type="password" />
              <Field icon={LockKeyhole} label="Confirm Password" value={form.confirm_password} error={errors.confirm_password} onChange={(value) => update('confirm_password', value)} type="password" />
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100 sm:col-span-2">
                A unique public/private key pair is generated for this account. Transfers are signed and verified before settlement.
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="btn-secondary" disabled={step === 0 || loading} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
              <ArrowLeft size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" className="btn-primary" disabled={loading} onClick={next}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-primary min-w-52" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-5">
          <div className="glass rounded-lg p-5">
            <p className="text-sm text-cyan-200">Account summary preview</p>
            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Available balance</p>
                  <p className="mt-2 text-3xl font-bold">{preview.balance}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-300/10 text-cyan-200">
                  <Banknote />
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-300">
                <PreviewRow label="Holder" value={preview.holder} />
                <PreviewRow label="Account" value={preview.account} />
                <PreviewRow label="Bank" value={preview.bank} />
                <PreviewRow label="Branch" value={preview.branch} />
                <PreviewRow label="Type" value={preview.type} />
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <p className="text-sm font-semibold text-white">Secure registration indicators</p>
            <div className="mt-4 grid gap-3">
              {['Balance stored in database', 'Overdraft protection enabled', 'Fraud engine linked to account activity', 'Digital signature verification required'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
                  <CheckCircle2 size={17} className="text-emerald-300" /> {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value, onChange, type = 'text', min, error, placeholder, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3 top-3.5 text-slate-500" size={18} />
        <input className={`input pl-10 ${error ? 'border-rose-400 focus:border-rose-300' : ''}`} value={value} onChange={(event) => onChange(event.target.value)} type={type} min={min} placeholder={placeholder} />
      </span>
      {hint && !error && <p className="mt-2 text-xs text-cyan-200">{hint}</p>}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </label>
  )
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  )
}
