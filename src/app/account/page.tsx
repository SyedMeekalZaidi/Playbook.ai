'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('loggedInEmail');
    if (!email) return;

    fetch(`/api/user?email=${email}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data.user);
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  return (
    <div>
      <NavBar />
      <div style={{ padding: '2rem' }}>
        <h1>Account Page</h1>
        {user ? (
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Password:</strong> {user.password}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
}
