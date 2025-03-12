import { useRouter } from 'next/router';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../styles/Login.module.css'; // Import custom styles
import NavBar from "../components/NavBar";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email === 'test@gmail.com' && password === 'pass') {
      setIsLoggedIn(true);
      router.push('/diagram');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div>
      {/* Navigation Bar */}
      <NavBar />

      {/* Show Login or Main Content */}
      {isLoggedIn ? (
        <div className={styles.mainContent}>
          <h1>Main page</h1>
          <p>Use navigation bar to move between pages</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
