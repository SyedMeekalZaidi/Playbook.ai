import { useRouter } from 'next/router';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './../components/NavBar';
import Login from './login';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email === 'test@example.com' && password === 'password') {
      setIsLoggedIn(true);
      router.push('/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div>
      {/* Include Header */}
      <NavBar />

      
      {/* Directly use the Login component */}
      <Login />

    </div>
  );
}
