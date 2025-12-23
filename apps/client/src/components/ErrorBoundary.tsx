import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isEnvError = this.state.error?.message?.includes("environment variables");

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Erro de Configuração
              </h1>
            </div>

            {isEnvError ? (
              <>
                <p className="text-slate-700 mb-4">
                  As variáveis de ambiente do Supabase não estão configuradas.
                </p>
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    Variáveis necessárias:
                  </p>
                  <ul className="text-sm text-slate-700 space-y-1 font-mono">
                    <li>• VITE_SUPABASE_URL</li>
                    <li>• VITE_SUPABASE_ANON_KEY</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    📝 Como configurar no Vercel:
                  </p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Acesse o dashboard do projeto no Vercel</li>
                    <li>Vá em "Settings" → "Environment Variables"</li>
                    <li>Adicione as variáveis acima</li>
                    <li>Faça redeploy do projeto</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-700 mb-4">
                  Ocorreu um erro ao carregar a aplicação.
                </p>
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    Detalhes do erro:
                  </p>
                  <pre className="text-xs text-red-800 overflow-x-auto">
                    {this.state.error?.message}
                  </pre>
                </div>
              </>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
