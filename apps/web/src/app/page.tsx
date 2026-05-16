'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vca/ui';
import { Input } from '@vca/ui';
import styles from './page.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] Attempting login for:', username);
    setError('');
    setLoading(true);

    try {
      console.log('[Login] Fetching /api/auth/login...');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('[Login] Response status:', res.status);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push(`/dashboard/${data.role.toLowerCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Venture Chess Academy</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div className={styles.error}>{error}</div>}
          
          <Input 
            label="Username" 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Enter your username"
            required 
          />
          
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter your password"
            required 
          />
          
          <Button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </main>
  );
}
