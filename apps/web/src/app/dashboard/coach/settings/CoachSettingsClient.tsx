'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@vca/ui';
import styles from '../../admin/settings/settings.module.css';

interface Props {
  userId: string;
  username: string;
}

export function CoachSettingsClient({ userId, username }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    countryCode: '',
    mobile: '',
    dob: '',
    country: '',
    city: '',
    address: '',
    fideProfile: '',
    lichessProfile: '',
    chesscomProfile: '',
    specialization: '',
    bio: '',
    profilePhoto: ''
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            firstName: data.firstName || '',
            middleName: data.middleName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            countryCode: data.countryCode || '',
            mobile: data.mobile || '',
            dob: data.dob || '',
            country: data.country || '',
            city: data.city || '',
            address: data.address || '',
            fideProfile: data.fideProfile || '',
            lichessProfile: data.lichessProfile || '',
            chesscomProfile: data.chesscomProfile || '',
            specialization: data.coach?.specialization || '',
            bio: data.coach?.bio || '',
            profilePhoto: data.profilePhoto || ''
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToastMessage('Image size must be less than 2MB');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setToastMessage('Profile updated successfully!');
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setToastMessage(data.error || 'Failed to update profile.');
        } else {
          const text = await res.text();
          console.error('Non-JSON error response:', text);
          setToastMessage(`Server error: ${res.status} ${res.statusText}`);
        }
      }
    } catch (err: any) {
      console.error('Profile save exception:', err);
      setToastMessage(`Error: ${err.message || 'An error occurred.'}`);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
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

  if (isLoading) {
    return <div className={styles.container}>Loading profile...</div>;
  }

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
                <form className={styles.form} onSubmit={handleProfileSave}>
                  <div className={styles.avatarSection}>
                    <div className={styles.avatarPreview}>
                      {formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Profile" className={styles.avatarImage} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {formData.firstName?.[0] || username?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className={styles.avatarActions}>
                      <label className={styles.uploadBtn}>
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                      <button 
                        type="button" 
                        className={styles.removePhotoBtn}
                        onClick={() => setFormData(prev => ({ ...prev, profilePhoto: '' }))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={styles.fieldGroup}>
                      <label>FIRST NAME</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>LAST NAME</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>MIDDLE NAME</label>
                    <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={styles.input} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={styles.fieldGroup}>
                      <label>EMAIL</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>DATE OF BIRTH</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={styles.input} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                    <div className={styles.fieldGroup}>
                      <label>CODE</label>
                      <input type="text" name="countryCode" placeholder="+1" value={formData.countryCode} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>MOBILE</label>
                      <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>ADDRESS</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className={styles.input} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={styles.fieldGroup}>
                      <label>CITY</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>COUNTRY</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange} className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>SPECIALIZATION</label>
                    <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className={styles.input} />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>BIO</label>
                    <textarea 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      className={styles.input} 
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className={styles.fieldGroup}>
                      <label>FIDE PROFILE</label>
                      <input type="text" name="fideProfile" value={formData.fideProfile} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>LICHESS</label>
                      <input type="text" name="lichessProfile" value={formData.lichessProfile} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>CHESS.COM</label>
                      <input type="text" name="chesscomProfile" value={formData.chesscomProfile} onChange={handleChange} className={styles.input} />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    variant="primary" 
                    style={{ marginTop: '16px' }}
                  >
                    Save Profile
                  </Button>
                </form>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Change Password</h3>
                <form className={styles.form} onSubmit={handlePasswordSave}>
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
