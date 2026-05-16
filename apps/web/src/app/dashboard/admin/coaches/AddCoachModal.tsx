'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Upload } from 'lucide-react';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/data';
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
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    country: 'India',
    city: '',
    bio: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        setFormData({
          firstName: initialData.firstName || '',
          middleName: initialData.middleName || '',
          lastName: initialData.lastName || '',
          dob: initialData.dob || '',
          email: initialData.email || '',
          countryCode: initialData.countryCode || '+91',
          mobile: initialData.mobile || '',
          country: initialData.country || 'India',
          city: initialData.city || '',
          bio: initialData.bio || ''
        });
        setPhotoPreview(initialData.photo || null);
      } else {
        // Reset form on new registration
        setFormData({
          firstName: '', middleName: '', lastName: '',
          dob: '', email: '', countryCode: '+91', mobile: '',
          country: 'India', city: '', bio: ''
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
                <input 
                  type="date" 
                  name="dob" 
                  value={formData.dob} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder="dd-mm-yyyy"
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
          </div>

          {/* SECTION 3: CONTACT & LOCATION */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Contact & Location</h3>
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
