import { useState, type FormEvent } from 'react';
import { publicClient } from './api';
import { useT, type UIStringKey } from './uiStrings';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FieldErrors {
  name?: string;
  contact?: string;
}

const PRODUCT_TYPE_KEYS: UIStringKey[] = [
  'contact.type.stone',
  'contact.type.doors',
  'contact.type.windows',
  'contact.type.elevators',
  'contact.type.complex',
];

export function ContactForm() {
  const ui = useT();
  const productTypes = PRODUCT_TYPE_KEYS.map((key) => ui(key));

  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(productTypes[0]);
  const [message, setMessage] = useState('');

  const reset = () => {
    setName('');
    setContact('');
    setEmail('');
    setType(productTypes[0]);
    setMessage('');
    setErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = ui('contact.nameRequired');
    if (!contact.trim()) nextErrors.contact = ui('contact.phoneRequired');
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
        <div className="form-success-title">{ui('contact.successTitle')}</div>
        <p>{ui('contact.successMessage')}</p>
        <button type="button" className="btn btn-dark-ghost" onClick={() => setStatus('idle')}>
          {ui('contact.clearForm')}
        </button>
      </div>
    );
  }

  return (
    <>
      <form id="contactForm" noValidate onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="field">
            <label htmlFor="fName">{ui('contact.nameLabel')}</label>
            <input
              id="fName"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={ui('contact.namePlaceholder')}
              required
              aria-describedby="fName-error"
              aria-invalid={errors.name ? 'true' : undefined}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p id="fName-error" className="field-error">{errors.name}</p>
          </div>
          <div className="field">
            <label htmlFor="fContact">{ui('contact.phoneLabel')}</label>
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
          <label htmlFor="fEmail">{ui('contact.emailLabel')}</label>
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
          <label htmlFor="fType">{ui('contact.interestLabel')}</label>
          <select id="fType" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {productTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fMsg">{ui('contact.messageLabel')}</label>
          <textarea
            id="fMsg"
            name="msg"
            rows={3}
            placeholder={ui('contact.messagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? ui('contact.submitting') : ui('contact.submit')}
        </button>
        <div className="form-disclaimer">{ui('contact.disclaimer')}</div>
      </form>
      {status === 'error' && (
        <div id="formError" className="form-error" role="alert" aria-live="assertive">
          <div className="form-error-title">{ui('contact.errorTitle')}</div>
          <p id="formErrorMessage">{ui('contact.errorMessage')}</p>
        </div>
      )}
    </>
  );
}
