import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Role } from '../../lib/api';
import { Button, Field, inputClass, Notice, PasswordInput } from '../ui';
import { BrandMark } from '../Navbar';
import { HERO_FARMER_SUNRISE } from '../../data/mockData';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify';

interface AuthViewProps {
  mode: AuthMode;
  token?: string;
  initialRole?: Exclude<Role, 'admin'>;
  onNavigate: (view: string) => void;
  onAuthenticated: (firstTime: boolean) => void;
}

const ROLE_OPTIONS: { role: Exclude<Role, 'admin'>; title: string; text: string }[] = [
  { role: 'enthusiast', title: 'Agriculture Enthusiast', text: 'Learn, join discussions and events, find jobs.' },
  { role: 'farmer', title: 'Farmer / Farm', text: 'Book experts, hire workers, manage your farm.' },
  { role: 'specialist', title: 'Specialist / Consultant', text: 'Offer consultations, publish, get paid.' },
  { role: 'business', title: 'Agricultural Business', text: 'Promote products, sponsor events, hire.' }
];

export const AuthView: React.FC<AuthViewProps> = ({ mode, token, initialRole, onNavigate, onAuthenticated }) => {
  const { login, signup, setUser } = useAuth();
  const [role, setRole] = useState<Exclude<Role, 'admin'> | null>(initialRole ?? null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [devLink, setDevLink] = useState('');

  useEffect(() => {
    setError('');
    setDone('');
  }, [mode]);

  // Email verification runs as soon as the page opens with a token.
  useEffect(() => {
    if (mode !== 'verify' || !token) return;
    setBusy(true);
    api
      .post<{ user: any }>('/auth/verify-email', { token })
      .then((r) => {
        setUser(r.user);
        setDone('Your email is confirmed. You can now post, comment and book.');
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setBusy(false));
  }, [mode, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        onAuthenticated(false);
      } else if (mode === 'signup') {
        if (!role) throw new ApiError(400, 'role', 'Choose how you’ll use Agro Inspo.');
        await signup({ name, email, password, role, acceptTerms });
        onAuthenticated(true);
      } else if (mode === 'forgot') {
        const r = await api.post<{ devResetLink?: string }>('/auth/request-reset', { email });
        setDone('If an account exists for that email, we’ve sent a link to reset your password. It expires in 1 hour.');
        if (r.devResetLink) setDevLink(r.devResetLink);
      } else if (mode === 'reset') {
        await api.post('/auth/reset-password', { token, password });
        setDone('Your password has been changed and you’ve been signed out everywhere. Log in with your new password.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const heading = {
    login: 'Welcome back.',
    signup: 'Join the ecosystem.',
    forgot: 'Reset your password.',
    reset: 'Choose a new password.',
    verify: 'Confirming your email.'
  }[mode];

  return (
    <div className="min-h-[calc(100vh-5rem)] grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Photo panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={HERO_FARMER_SUNRISE} alt="" className="absolute inset-0 w-full h-full object-cover object-[60%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <BrandMark className="w-8 h-8 text-lime" />
          <p className="mt-6 font-display text-[34px] leading-[1.15] tracking-[-0.025em] max-w-md">
            Learn, ask an expert, hire good hands and find the right partners.
          </p>
          <p className="mt-4 text-[13px] text-white/70 max-w-sm">
            One account for agriculture worldwide. Free to join, and always free to apply for jobs.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-start lg:items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-[460px]">
          {mode !== 'login' && mode !== 'signup' && (
            <button onClick={() => onNavigate('auth:login')} className="mb-8 inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-ink">
              <ArrowLeft className="w-4 h-4" /> Back to log in
            </button>
          )}
          <h1 className="font-display font-normal text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.03em]">{heading}</h1>

          {(mode === 'login' || mode === 'signup') && (
            <div className="mt-6 inline-flex p-1 rounded-full bg-mist text-[13px]" role="tablist">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => onNavigate(`auth:${m}`)}
                  className={`h-9 px-5 rounded-full transition-colors ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-slate-600'}`}
                >
                  {m === 'login' ? 'Log in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {mode === 'verify' ? (
            <div className="mt-8 space-y-4">
              {busy && <Notice>Checking your link…</Notice>}
              {error && <Notice tone="error">{error}</Notice>}
              {done && <Notice tone="success">{done}</Notice>}
              {!busy && (
                <Button variant="lime" onClick={() => onNavigate(done ? 'community' : 'auth:login')}>
                  {done ? 'Go to the community' : 'Log in'}
                </Button>
              )}
            </div>
          ) : done ? (
            <div className="mt-8 space-y-4">
              <Notice tone="success">{done}</Notice>
              {devLink && (
                <Notice>
                  Development mode: no email provider is configured yet, so here’s the link the email would contain.{' '}
                  <a className="underline break-all" href={devLink}>
                    Open reset link
                  </a>
                </Notice>
              )}
              {mode === 'reset' && (
                <Button variant="lime" onClick={() => onNavigate('auth:login')}>
                  Log in
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              {mode === 'signup' && (
                <fieldset>
                  <legend className="text-[13px] font-medium mb-2.5">How will you use Agro Inspo?</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map((o) => (
                      <button
                        type="button"
                        key={o.role}
                        aria-pressed={role === o.role}
                        onClick={() => setRole(o.role)}
                        className={`relative text-left rounded-2xl border p-4 transition-colors ${
                          role === o.role ? 'border-ink bg-white' : 'border-stone-200 bg-white hover:border-stone-400'
                        }`}
                      >
                        {role === o.role && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-lime flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <span className="block text-[14px] font-medium pr-6">{o.title}</span>
                        <span className="block mt-1 text-[12px] leading-snug text-slate-500">{o.text}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {mode === 'signup' && (
                <Field id="name" label={role === 'business' ? 'Business or trading name' : 'Full name'}>
                  <input id="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </Field>
              )}

              {mode !== 'reset' && (
                <Field id="email" label="Email">
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>
              )}

              {mode !== 'forgot' && (
                <Field
                  id="password"
                  label={mode === 'reset' ? 'New password' : 'Password'}
                  hint={mode === 'login' ? undefined : 'At least 10 characters.'}
                >
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                </Field>
              )}

              {mode === 'login' && (
                <button type="button" onClick={() => onNavigate('auth:forgot')} className="text-[13px] text-slate-600 hover:text-ink underline underline-offset-4">
                  Forgot your password?
                </button>
              )}

              {mode === 'signup' && (
                <label className="flex items-start gap-3 text-[13px] text-slate-600 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#141414]"
                  />
                  <span>
                    I agree to the Terms of Use, Privacy Policy and Community Guidelines, and I understand verification badges
                    describe what was checked, not a guarantee.
                  </span>
                </label>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <Button type="submit" variant="lime" busy={busy} className="w-full h-12 text-[14px]">
                {{ login: 'Log in', signup: 'Create account', forgot: 'Send reset link', reset: 'Save new password', verify: '' }[mode]}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
