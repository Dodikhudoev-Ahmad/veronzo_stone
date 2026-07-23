import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AdminErrorBoundaryProps {
  children: ReactNode;
}

interface AdminErrorBoundaryState {
  error: Error | null;
}

// Error boundaries must be class components — there is no hooks equivalent of
// componentDidCatch/getDerivedStateFromError as of React 19.
export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  state: AdminErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Admin panel crashed:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-cream-soft bg-bg-alt p-10 text-center">
          <p className="font-serif text-xl text-text">Что-то пошло не так</p>
          <p className="max-w-md text-sm text-muted">
            Не удалось отобразить этот раздел админ-панели. Попробуйте обновить страницу.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
