'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/data';
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
    parentFirstName: '',
    parentMiddleName: '',
    parentLastName: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    secParentFirstName: '',
    secParentMiddleName: '',
    secParentLastName: '',
    studentFirstName: '',
    studentMiddleName: '',
    studentLastName: '',
    dob: '',
    country: '',
    city: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      if (initialData) {
        setFormData({
          parentFirstName: initialData.parentFirstName || '',
          parentMiddleName: initialData.parentMiddleName || '',
          parentLastName: initialData.parentLastName || '',
          email: initialData.email || '',
          countryCode: initialData.countryCode || '+91',
          mobile: initialData.mobile || '',
          secParentFirstName: initialData.secParentFirstName || '',
          secParentMiddleName: initialData.secParentMiddleName || '',
          secParentLastName: initialData.secParentLastName || '',
          studentFirstName: initialData.studentFirstName || initialData.firstName || '',
          studentMiddleName: initialData.studentMiddleName || initialData.middleName || '',
          studentLastName: initialData.studentLastName || initialData.lastName || '',
          dob: initialData.dob || '',
          country: initialData.country || '',
          city: initialData.city || ''
        });
        setHasSecondary(!!initialData.secParentFirstName);
      } else {
        // Reset form for new student
        setFormData({
          parentFirstName: '', parentMiddleName: '', parentLastName: '',
          email: '', countryCode: '+91', mobile: '',
          secParentFirstName: '', secParentMiddleName: '', secParentLastName: '',
          studentFirstName: '', studentMiddleName: '', studentLastName: '',
          dob: '', country: '', city: ''
        });
        setHasSecondary(false);
      }
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If country changes, reset city
      if (name === 'country') {
        updated.city = '';
      }
      return updated;
    });
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.parentFirstName.trim()) newErrors.parentFirstName = 'Required';
    if (!formData.parentLastName.trim()) newErrors.parentLastName = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Required';
    
    if (hasSecondary) {
      if (!formData.secParentFirstName.trim()) newErrors.secParentFirstName = 'Required';
      if (!formData.secParentLastName.trim()) newErrors.secParentLastName = 'Required';
    }

    if (!formData.studentFirstName.trim()) newErrors.studentFirstName = 'Required';
    if (!formData.studentLastName.trim()) newErrors.studentLastName = 'Required';
    if (!formData.dob.trim()) newErrors.dob = 'Required';
    if (!formData.country.trim()) newErrors.country = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // Remap field names and clean up the object for the database
      const { 
        studentFirstName, studentMiddleName, studentLastName,
        ...rest 
      } = formData;

      const submittedData = {
        ...rest,
        firstName: studentFirstName,
        middleName: studentMiddleName,
        lastName: studentLastName,
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
          {/* SECTION 1 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Customer Details</h3>
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
                <label className={styles.label}>EMAIL ADDRESS *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>MOBILE NUMBER *</label>
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
                {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
              </div>
            </div>

            <label className={styles.checkboxGroup}>
              <input type="checkbox" checked={hasSecondary} onChange={e => setHasSecondary(e.target.checked)} className={styles.checkbox} />
              <span className={styles.checkboxLabel}>Add a secondary customer</span>
            </label>

            {hasSecondary && (
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
            )}
          </div>

          {/* SECTION 2 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Learner Details (Student)</h3>
              <div className={styles.divider} />
            </div>

            <div className={styles.row3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>STUDENT FIRST NAME *</label>
                <input name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} className={styles.input} />
                {errors.studentFirstName && <span className={styles.errorText}>{errors.studentFirstName}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>STUDENT MIDDLE NAME</label>
                <input name="studentMiddleName" value={formData.studentMiddleName} onChange={handleChange} className={styles.input} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>STUDENT LAST NAME *</label>
                <input name="studentLastName" value={formData.studentLastName} onChange={handleChange} className={styles.input} />
                {errors.studentLastName && <span className={styles.errorText}>{errors.studentLastName}</span>}
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>DATE OF BIRTH *</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={styles.input} />
                {errors.dob && <span className={styles.errorText}>{errors.dob}</span>}
              </div>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Further Information</h3>
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

