import { useRouter } from 'next/router';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../styles/Login.module.css';
import NavBar from './../components/NavBar';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // Default role is 'USER'
  const [secretKey, setSecretKey] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
          secretKey: role === 'ADMIN' ? secretKey : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      alert('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      {/* Include Header */}
      <NavBar />

      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            {/* Role Selection */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value.toUpperCase())}
              required
              className={styles.input}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Secret Key Input (Only for Admin) */}
            {role === 'ADMIN' && (
              <input
                type="password"
                placeholder="Admin Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
                className={styles.input}
              />
            )}

            <button type="submit" className={styles.button}>
              Login
            </button>
          </form>
          <p className={styles.signupText}>
            Don't have an account?{' '}
            <a onClick={() => router.push('/signup')} className={styles.link}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
