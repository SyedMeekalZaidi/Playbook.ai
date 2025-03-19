import { useRouter } from 'next/router';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../styles/Signup.module.css';
import NavBar from './../components/NavBar';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Example: Signup logic (replace with actual signup API call)
    alert('Account created successfully!');
    router.push('/diagram'); // Redirect to login after signup
  };

  return (
    <div>
      {/* Include Header */}
      <NavBar />

      <div className={styles.signupContainer}>
        <div className={styles.signupBox}>
          <h1 className={styles.title}>Sign Up</h1>
          <form onSubmit={handleSignup}>
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
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
            />
            <button type="submit" className={styles.button}>
              Sign Up
            </button>
          </form>
          <p className={styles.loginText}>
            Already have an account?{' '}
            <a onClick={() => router.push('/')} className={styles.link}>
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
