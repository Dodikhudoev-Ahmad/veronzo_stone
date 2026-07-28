import { useState, type FormEvent } from 'react';
import { publicClient } from './api';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FieldErrors {
  name?: string;
  contact?: string;
}

const PRODUCT_TYPES = ['Натуральный камень', 'Элитные двери', 'Окна', 'Лифты', 'Комплексный проект'];

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(PRODUCT_TYPES[0]);
  const [message, setMessage] = useState('');

  const reset = () => {
    setName('');
    setContact('');
    setEmail('');
    setType(PRODUCT_TYPES[0]);
    setMessage('');
    setErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = 'Пожалуйста, укажите имя.';
    if (!contact.trim()) nextErrors.contact = 'Пожалуйста, укажите телефон.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    try {
      await publicClient.post('/api/contact', { name, contact, email, type, message });
      setStatus('success');
      reset();
    } catch (err) {
      console.error('Contact form submission failed:', err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div id="formSuccess" className="form-success" role="status" aria-live="polite">
        <div className="form-success-title">Заявка отправлена</div>
        <p>Мы получили вашу заявку и свяжемся с вами в ближайшее время.</p>
        <button type="button" className="btn btn-dark-ghost" onClick={() => setStatus('idle')}>
          Очистить форму
        </button>
      </div>
    );
  }

  return (
    <>
      <form id="contactForm" noValidate onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="field">
            <label htmlFor="fName">Имя</label>
            <input
              id="fName"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              required
              aria-describedby="fName-error"
              aria-invalid={errors.name ? 'true' : undefined}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p id="fName-error" className="field-error">{errors.name}</p>
          </div>
          <div className="field">
            <label htmlFor="fContact">Телефон</label>
            <input
              id="fContact"
              name="contact"
              type="tel"
              autoComplete="tel"
              placeholder="+992 ...."
              required
              aria-describedby="fContact-error"
              aria-invalid={errors.contact ? 'true' : undefined}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <p id="fContact-error" className="field-error">{errors.contact}</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="fEmail">Email</label>
          <input
            id="fEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fType">Интересует</label>
          <select id="fType" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {PRODUCT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fMsg">О проекте</label>
          <textarea
            id="fMsg"
            name="msg"
            rows={3}
            placeholder="Объект, объём, сроки"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Отправка…' : 'Отправить заявку'}
        </button>
        <div className="form-disclaimer">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</div>
      </form>
      {status === 'error' && (
        <div id="formError" className="form-error" role="alert" aria-live="assertive">
          <div className="form-error-title">Не удалось отправить заявку</div>
          <p id="formErrorMessage">
            Проверьте подключение к интернету и попробуйте ещё раз, либо свяжитесь с нами напрямую по телефону
            или в мессенджере.
          </p>
        </div>
      )}
    </>
  );
}
