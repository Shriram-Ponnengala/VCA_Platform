'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Upload } from 'lucide-react';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/data';
import { DOBSelect } from '@/components/ui/DOBSelect';
import styles from './AddCoachModal.module.css';

interface AddCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coachData: any) => void;
  initialData?: any;
}

export function AddCoachModal({ isOpen, onClose, onSave, initialData }: AddCoachModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    address: '',
    country: 'India',
    city: '',
    fideProfile: '',
    lichessProfile: '',
    chesscomProfile: '',
    bio: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        setFormData({
          username: initialData.username || '',
          firstName: initialData.firstName || '',
          middleName: initialData.middleName || '',
          lastName: initialData.lastName || '',
          dob: initialData.dob || '',
          email: initialData.email || '',
          countryCode: initialData.countryCode || '+91',
          mobile: initialData.mobile || '',
          address: initialData.address || '',
          country: initialData.country || 'India',
          city: initialData.city || '',
          fideProfile: initialData.fideProfile || '',
          lichessProfile: initialData.lichessProfile || '',
          chesscomProfile: initialData.chesscomProfile || '',
          bio: initialData.bio || ''
        });
        setPhotoPreview(initialData.photo || null);
      } else {
        // Reset form on new registration
        setFormData({
          username: '',
          firstName: '', middleName: '', lastName: '',
          dob: '', email: '', countryCode: '+91', mobile: '',
          address: '', country: 'India', city: '', 
          fideProfile: '', lichessProfile: '', chesscomProfile: '',
          bio: ''
        });
        setPhotoPreview(null);
      }
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'country') {
        updated.city = '';
      }
      return updated;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Required';
    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    if (!formData.country.trim()) newErrors.country = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...formData,
        photo: photoPreview
      });
    }
  };

  const availableCities = formData.country ? CITIES_BY_COUNTRY[formData.country] || [] : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? 'Edit Instructor' : 'Register New Instructor'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* SECTION 1: PHOTO UPLOAD */}
          <div className={styles.photoUploadSection}>
            <div className={styles.photoCircle} onClick={handlePhotoClick}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className={styles.previewImage} />
              ) : (
                <User size={48} className={styles.uploadIcon} />
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/jpeg,image/png" 
                style={{ display: 'none' }} 
              />
            </div>
            <span className={styles.uploadText}>Tap to upload photo</span>
          </div>

          {/* SECTION 2: COACH DETAILS */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Coach Details</h3>
              <div className={styles.divider} />
            </div>

            <div className={styles.row3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>FIRST NAME *</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} placeholder="First Name" />
                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>MIDDLE NAME</label>
                <input name="middleName" value={formData.middleName} onChange={handleChange} className={styles.input} placeholder="Middle Name" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>LAST NAME *</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} placeholder="Last Name" />
                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>DATE OF BIRTH</label>
                <DOBSelect 
                  value={formData.dob} 
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, dob: val }));
                    if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                  }}
                  error={errors.dob}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>EMAIL ADDRESS *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder="Email Address"
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>
            </div>
            <div className={styles.row3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>FIDE PROFILE</label>
                <input name="fideProfile" value={formData.fideProfile} onChange={handleChange} className={styles.input} placeholder="FIDE ID or URL" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>LICHESS PROFILE</label>
                <input name="lichessProfile" value={formData.lichessProfile} onChange={handleChange} className={styles.input} placeholder="Lichess Username" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>CHESS.COM PROFILE</label>
                <input name="chesscomProfile" value={formData.chesscomProfile} onChange={handleChange} className={styles.input} placeholder="Chess.com Username" />
              </div>
            </div>

            <div className={styles.specialUsernameBox}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>CREATE USERNAME *</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  className={`${styles.input} ${styles.usernameInput}`} 
                  placeholder="e.g. grandmaster_john" 
                />
                {errors.username && <span className={styles.errorText}>{errors.username}</span>}
              </div>
            </div>
          </div>

          {/* SECTION 3: OTHER DETAILS */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Other Details</h3>
              <div className={styles.divider} />
            </div>

            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>MOBILE NUMBER</label>
                <div className={styles.phoneGroup}>
                  <select name="countryCode" value={formData.countryCode} onChange={handleChange} className={`${styles.select} ${styles.countryCode}`}>
                    {COUNTRIES.map(c => (
                      <option key={`${c.code}-${c.dial_code}`} value={c.dial_code}>
                        {c.code} {c.dial_code}
                      </option>
                    ))}
                  </select>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="9876543210" className={styles.input} />
                </div>
              </div>
            </div>

            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ADDRESS</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  rows={2} 
                  placeholder="Street Address..." 
                  className={styles.textarea}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>COUNTRY *</label>
                <select name="country" value={formData.country} onChange={handleChange} className={styles.select}>
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.country && <span className={styles.errorText}>{errors.country}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>CITY (OPTIONAL)</label>
                <select name="city" value={formData.city} onChange={handleChange} className={styles.select} disabled={!formData.country}>
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>SHORT BIO</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  rows={5} 
                  placeholder="Brief professional summary..." 
                  className={styles.textarea}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.requiredNote}>* Required fields</span>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>
              {initialData ? 'Update Coach' : 'Save Coach'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
