'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, User } from 'lucide-react';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/data';
import { DOBSelect } from '@/components/ui/DOBSelect';
import styles from './AddStudentModal.module.css';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: any) => void;
  initialData?: any;
}

export function AddStudentModal({ isOpen, onClose, onSave, initialData }: AddStudentModalProps) {
  const [hasSecondary, setHasSecondary] = useState(false);
  const [formData, setFormData] = useState({
    // Student Details
    studentFirstName: '',
    studentMiddleName: '',
    studentLastName: '',
    studentEmail: '',
    studentCountryCode: '+91',
    studentMobile: '',
    dob: '',
    username: '',
    profilePhoto: '',

    // Parent Details
    parentFirstName: '',
    parentMiddleName: '',
    parentLastName: '',
    parentEmail: '',
    parentCountryCode: '+91',
    parentMobile: '',

    // Secondary Parent Details
    secParentFirstName: '',
    secParentMiddleName: '',
    secParentLastName: '',
    secParentEmail: '',
    secParentCountryCode: '+91',
    secParentMobile: '',

    // Other details
    country: '',
    city: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      if (initialData) {
        setFormData({
          studentFirstName: initialData.studentFirstName || initialData.firstName || '',
          studentMiddleName: initialData.studentMiddleName || initialData.middleName || '',
          studentLastName: initialData.studentLastName || initialData.lastName || '',
          studentEmail: initialData.studentEmail || initialData.email || '',
          studentCountryCode: initialData.studentCountryCode || '+91',
          studentMobile: initialData.studentMobile || initialData.mobile || '',
          dob: initialData.dob || '',
          username: initialData.username || '',
          profilePhoto: initialData.profilePhoto || initialData.avatar || '',

          parentFirstName: initialData.parentFirstName || '',
          parentMiddleName: initialData.parentMiddleName || '',
          parentLastName: initialData.parentLastName || '',
          parentEmail: initialData.parentEmail || '',
          parentCountryCode: initialData.parentCountryCode || '+91',
          parentMobile: initialData.parentMobile || '',

          secParentFirstName: initialData.secParentFirstName || '',
          secParentMiddleName: initialData.secParentMiddleName || '',
          secParentLastName: initialData.secParentLastName || '',
          secParentEmail: initialData.secParentEmail || '',
          secParentCountryCode: initialData.secParentCountryCode || '+91',
          secParentMobile: initialData.secParentMobile || '',

          country: initialData.country || '',
          city: initialData.city || ''
        });
        setHasSecondary(!!initialData.secParentFirstName);
      } else {
        setFormData({
          studentFirstName: '', studentMiddleName: '', studentLastName: '',
          studentEmail: '', studentCountryCode: '+91', studentMobile: '', dob: '', username: '', profilePhoto: '',
          parentFirstName: '', parentMiddleName: '', parentLastName: '', parentEmail: '', parentCountryCode: '+91', parentMobile: '',
          secParentFirstName: '', secParentMiddleName: '', secParentLastName: '', secParentEmail: '', secParentCountryCode: '+91', secParentMobile: '',
          country: '', city: ''
        });
        setHasSecondary(false);
      }
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentFirstName.trim()) newErrors.studentFirstName = 'Required';
    if (!formData.studentLastName.trim()) newErrors.studentLastName = 'Required';
    if (!formData.studentEmail.trim()) newErrors.studentEmail = 'Required';
    if (!formData.studentMobile.trim()) newErrors.studentMobile = 'Required';
    if (!formData.dob.trim()) newErrors.dob = 'Required';
    if (!formData.username.trim()) newErrors.username = 'Required';

    if (!formData.parentFirstName.trim()) newErrors.parentFirstName = 'Required';
    if (!formData.parentLastName.trim()) newErrors.parentLastName = 'Required';
    if (!formData.parentEmail.trim()) newErrors.parentEmail = 'Required';
    if (!formData.parentMobile.trim()) newErrors.parentMobile = 'Required';
    
    if (hasSecondary) {
      if (!formData.secParentFirstName.trim()) newErrors.secParentFirstName = 'Required';
      if (!formData.secParentLastName.trim()) newErrors.secParentLastName = 'Required';
    }

    if (!formData.country.trim()) newErrors.country = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const { 
        studentFirstName, studentMiddleName, studentLastName,
        studentEmail, studentMobile, profilePhoto,
        ...rest 
      } = formData;

      const submittedData = {
        ...rest,
        firstName: studentFirstName,
        middleName: studentMiddleName,
        lastName: studentLastName,
        studentFirstName,
        studentMiddleName,
        studentLastName,
        studentEmail,
        studentMobile,
        email: studentEmail,
        mobile: studentMobile,
        profilePhoto
      };
      onSave(submittedData);
    }
  };

  const availableCities = formData.country ? CITIES_BY_COUNTRY[formData.country] || [] : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? 'Edit Student Details' : 'Register New Student'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* SECTION 1: Student Details */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Student Details</h3>
              <div className={styles.divider} />
            </div>

            <div className={styles.photoUploadContainer}>
              <div 
                className={styles.photoPreview} 
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundImage: formData.profilePhoto ? `url(${formData.profilePhoto})` : 'none' }}
              >
                {!formData.profilePhoto && <User size={32} className={styles.photoIcon} />}
                <div className={styles.photoOverlay}>
                  <Upload size={16} />
                  <span>Upload</span>
                </div>
              </div>
              <div className={styles.photoInfo}>
                <p className={styles.photoLabel}>Profile Photo (Optional)</p>
                <p className={styles.photoSubtext}>Click to upload a square image. Max 2MB.</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            <div className={styles.row3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>FIRST NAME *</label>
                <input name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} className={styles.input} />
                {errors.studentFirstName && <span className={styles.errorText}>{errors.studentFirstName}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>MIDDLE NAME</label>
                <input name="studentMiddleName" value={formData.studentMiddleName} onChange={handleChange} className={styles.input} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>LAST NAME *</label>
                <input name="studentLastName" value={formData.studentLastName} onChange={handleChange} className={styles.input} />
                {errors.studentLastName && <span className={styles.errorText}>{errors.studentLastName}</span>}
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>EMAIL ADDRESS *</label>
                <input type="email" name="studentEmail" value={formData.studentEmail} onChange={handleChange} className={styles.input} />
                {errors.studentEmail && <span className={styles.errorText}>{errors.studentEmail}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>MOBILE NUMBER *</label>
                <div className={styles.phoneGroup}>
                  <select name="studentCountryCode" value={formData.studentCountryCode} onChange={handleChange} className={`${styles.select} ${styles.countryCode}`}>
                    {COUNTRIES.map(c => (
                      <option key={`student-${c.code}-${c.dial_code}`} value={c.dial_code}>
                        {c.code} {c.dial_code}
                      </option>
                    ))}
                  </select>
                  <input type="tel" name="studentMobile" value={formData.studentMobile} onChange={handleChange} placeholder="9876543210" className={styles.input} />
                </div>
                {errors.studentMobile && <span className={styles.errorText}>{errors.studentMobile}</span>}
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>DATE OF BIRTH *</label>
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
                <label className={styles.label}>CREATE USERNAME *</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  className={styles.input}
                  style={{ backgroundColor: '#fdf8f4', border: '1px solid var(--secondary)' }}
                  placeholder="e.g. magnus123"
                />
                {errors.username && <span className={styles.errorText}>{errors.username}</span>}
              </div>
            </div>
          </div>

          {/* SECTION 2: Parent's Details */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Parent's Details</h3>
              <div className={styles.divider} />
            </div>

            <div className={styles.row3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PARENT FIRST NAME *</label>
                <input name="parentFirstName" value={formData.parentFirstName} onChange={handleChange} className={styles.input} />
                {errors.parentFirstName && <span className={styles.errorText}>{errors.parentFirstName}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PARENT MIDDLE NAME</label>
                <input name="parentMiddleName" value={formData.parentMiddleName} onChange={handleChange} className={styles.input} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PARENT LAST NAME *</label>
                <input name="parentLastName" value={formData.parentLastName} onChange={handleChange} className={styles.input} />
                {errors.parentLastName && <span className={styles.errorText}>{errors.parentLastName}</span>}
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PARENT EMAIL ADDRESS *</label>
                <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className={styles.input} />
                {errors.parentEmail && <span className={styles.errorText}>{errors.parentEmail}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PARENT MOBILE NUMBER *</label>
                <div className={styles.phoneGroup}>
                  <select name="parentCountryCode" value={formData.parentCountryCode} onChange={handleChange} className={`${styles.select} ${styles.countryCode}`}>
                    {COUNTRIES.map(c => (
                      <option key={`parent-${c.code}-${c.dial_code}`} value={c.dial_code}>
                        {c.code} {c.dial_code}
                      </option>
                    ))}
                  </select>
                  <input type="tel" name="parentMobile" value={formData.parentMobile} onChange={handleChange} placeholder="9876543210" className={styles.input} />
                </div>
                {errors.parentMobile && <span className={styles.errorText}>{errors.parentMobile}</span>}
              </div>
            </div>

            <label className={styles.checkboxGroup}>
              <input type="checkbox" checked={hasSecondary} onChange={e => setHasSecondary(e.target.checked)} className={styles.checkbox} />
              <span className={styles.checkboxLabel}>Add another parent</span>
            </label>

            {hasSecondary && (
              <>
                <div className={styles.row3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>SEC. PARENT FIRST NAME *</label>
                    <input name="secParentFirstName" value={formData.secParentFirstName} onChange={handleChange} className={styles.input} />
                    {errors.secParentFirstName && <span className={styles.errorText}>{errors.secParentFirstName}</span>}
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>SEC. PARENT MIDDLE NAME</label>
                    <input name="secParentMiddleName" value={formData.secParentMiddleName} onChange={handleChange} className={styles.input} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>SEC. PARENT LAST NAME *</label>
                    <input name="secParentLastName" value={formData.secParentLastName} onChange={handleChange} className={styles.input} />
                    {errors.secParentLastName && <span className={styles.errorText}>{errors.secParentLastName}</span>}
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>SEC. PARENT EMAIL ADDRESS</label>
                    <input type="email" name="secParentEmail" value={formData.secParentEmail} onChange={handleChange} className={styles.input} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>SEC. PARENT MOBILE NUMBER</label>
                    <div className={styles.phoneGroup}>
                      <select name="secParentCountryCode" value={formData.secParentCountryCode} onChange={handleChange} className={`${styles.select} ${styles.countryCode}`}>
                        {COUNTRIES.map(c => (
                          <option key={`secparent-${c.code}-${c.dial_code}`} value={c.dial_code}>
                            {c.code} {c.dial_code}
                          </option>
                        ))}
                      </select>
                      <input type="tel" name="secParentMobile" value={formData.secParentMobile} onChange={handleChange} placeholder="9876543210" className={styles.input} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SECTION 3: Other details */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Other details</h3>
              <div className={styles.divider} />
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
                <label className={styles.label}>CITY *</label>
                <select name="city" value={formData.city} onChange={handleChange} className={styles.select} disabled={!formData.country}>
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <span className={styles.errorText}>{errors.city}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.requiredText}>* Required fields</span>
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>{initialData ? 'Update Student' : 'Save Student'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


