'use client';

import React, { useState } from 'react';
import { Button } from '@vca/ui';
import styles from '../../admin/settings/settings.module.css';

interface Props {
  userId: string;
  username: string;
}

export function CoachSettingsClient({ userId, username }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setToastMessage('Please enter a new password.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    if (password !== confirmPassword) {
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setToastMessage('Password updated successfully!');
        setPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setToastMessage(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setToastMessage('An error occurred.');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Update your profile and security settings.</p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.contentArea} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.tabContent}>
            <div className={styles.accountGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Profile Information</h3>
                <div className={styles.form}>
                  <div className={styles.fieldGroup}>
                    <label>USERNAME</label>
                    <input 
                      type="text" 
                      value={username} 
                      disabled
                      className={styles.input} 
                      style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                    />
                    <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>Username cannot be changed.</small>
                  </div>
                </div>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Change Password</h3>
                <form className={styles.form} onSubmit={handleSave}>
                  <div className={styles.fieldGroup}>
                    <label>NEW PASSWORD</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className={styles.input} 
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>CONFIRM NEW PASSWORD</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className={styles.input} 
                    />
                  </div>
                  <Button 
                    type="submit"
                    variant="secondary" 
                    className={styles.changePasswordBtn}
                  >
                    Change Password
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
