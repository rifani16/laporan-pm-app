import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Harap isi username dan password');
      return;
    }

    const result = await login(username.trim(), password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || 'Username atau password salah.');
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-teal-800 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200 px-6 pb-5 pt-6 sm:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Sistem Pelaporan PM</h1>
          <p className="mt-1 text-sm text-gray-600">
            Masuk untuk mengakses data penerima manfaat
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                  placeholder="Masukkan username"
                  className="min-h-11 w-full rounded-lg border border-gray-500 bg-white py-2 pl-10 pr-3 text-base text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan password"
                  className="min-h-11 w-full rounded-lg border border-gray-500 bg-white py-2 pl-10 pr-12 text-base text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute inset-y-0 right-0 flex items-center min-w-11 justify-center text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
