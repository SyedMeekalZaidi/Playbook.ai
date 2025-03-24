'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../../styles/Signup.module.css';
import NavBar from '../../components/NavBar';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER'); // Changed to uppercase
  const [secretKey, setSecretKey] = useState(''); // New state for secret key

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // If role is ADMIN, check if secret key is provided
    if (role === 'ADMIN' && !secretKey) {
      alert('Please provide the secret key for admin signup');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password, 
          role, 
          secretKey: role === 'ADMIN' ? secretKey : undefined // Include secretKey only for admin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      alert('Account created successfully!');
      router.push('/diagram');
    } catch (error: any) {
      alert(`Error: ${error.message || 'Signup failed'}`);
    }
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

            {/* Role Selection */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value.toUpperCase())} // Convert to uppercase
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
