import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useAuth } from '../auth/useAuth';
import { AdminLoader } from '../components/AdminLoader';

const loginSchema = z.object({
  email: z.string().min(1, 'Укажите email').email('Некорректный email'),
  password: z.string().min(1, 'Укажите пароль'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (loading) {
    return <AdminLoader />;
  }

  // Already have a valid session (e.g. cookie survived a reload) — no reason
  // to show the login form.
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      // Backend intentionally returns the same generic message for a wrong
      // password and an unknown email — surfaced as-is, not reinterpreted.
      if (error instanceof AxiosError && error.response?.status === 401) {
        setFormError('Неверный email или пароль');
      } else {
        setFormError('Не удалось выполнить вход. Попробуйте ещё раз.');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 font-sans">
      <div className="w-full max-w-sm rounded-lg border border-cream-soft bg-bg-alt p-8 shadow-sm">
        <div className="mb-8 text-center font-serif text-2xl font-semibold tracking-widest text-text">VERONZO</div>
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="rounded-md border border-cream-soft bg-white px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.email ? 'true' : undefined}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="rounded-md border border-cream-soft bg-white px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.password ? 'true' : undefined}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-cream transition hover:brightness-110 disabled:opacity-60"
          >
            {isSubmitting ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
