'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserCircle, 
  Palette, 
  Camera, 
  Globe, 
  Mail, 
  Phone, 
  ChevronRight,
  Clock,
  Layout,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'branding'>('profile');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [profile, setProfile] = useState({
    name: 'Venture Chess Academy',
    motto: 'Empowering Future Grandmasters',
    email: 'hello@venturechess.com',
    phone: '+91 95670 27370'
  });

  const [account, setAccount] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@venturechess.com',
    phone: '1234567890'
  });

  const [scheduling, setScheduling] = useState({
    timezone: 'Asia/Kolkata',
    duration: '60 Minutes',
    buffer: '15 Minutes',
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    startSlots: '10:00, 16:00, 18:00'
  });

  const [branding, setBranding] = useState({
    headingFont: 'DM Sans (Default)',
    bodyFont: 'Inter (Default)',
    primaryColor: '#551e19'
  });

  useEffect(() => {
    const storedProfile = localStorage.getItem('vca_settings_profile');
    const storedAccount = localStorage.getItem('vca_settings_account');
    const storedScheduling = localStorage.getItem('vca_settings_scheduling');
    const storedBranding = localStorage.getItem('vca_settings_branding');
    
    if (storedProfile) setProfile(JSON.parse(storedProfile));
    if (storedAccount) setAccount(JSON.parse(storedAccount));
    if (storedScheduling) setScheduling(JSON.parse(storedScheduling));
    if (storedBranding) setBranding(JSON.parse(storedBranding));
  }, []);

  const handleSave = () => {
    localStorage.setItem('vca_settings_profile', JSON.stringify(profile));
    localStorage.setItem('vca_settings_account', JSON.stringify(account));
    localStorage.setItem('vca_settings_scheduling', JSON.stringify(scheduling));
    localStorage.setItem('vca_settings_branding', JSON.stringify(branding));
    setToastMessage('Settings saved successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePasswordChange = () => {
    alert('Password change request sent! In a real app, this would verify your current password.');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Welcome back to the academy</p>
        </div>
        <Button 
          className={styles.saveBtn}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </header>

      <div className={styles.mainGrid}>
        {/* Left Panel: Tabs */}
        <aside className={styles.sidebar}>
          <div className={styles.settingsTitle}>
            <h2 className={styles.sidebarHeading}>Settings</h2>
            <p className={styles.sidebarSub}>Manage academy profile, preferences and configurations.</p>
          </div>
          <nav className={styles.tabs}>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Building2 size={18} />
              <span>Academy Profile</span>
            </button>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'account' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <UserCircle size={18} />
              <span>Admin Account</span>
            </button>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'branding' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <Clock size={18} />
              <span>Scheduling & Branding</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <div className={styles.row}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>General Information</h3>
                  <div className={styles.form}>
                    <div className={styles.fieldGroup}>
                      <label>Academy Name</label>
                      <input 
                        type="text" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Academy Motto</label>
                      <input 
                        type="text" 
                        value={profile.motto} 
                        onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Contact Details</h3>
                  <div className={styles.form}>
                    <div className={styles.fieldGroup}>
                      <label>Public Email</label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Public Phone</label>
                      <input 
                        type="text" 
                        value={profile.phone} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className={styles.tabContent}>
              <div className={styles.accountGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Admin Profile</h3>
                  <div className={styles.form}>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>FIRST NAME</label>
                        <input 
                          type="text" 
                          value={account.firstName} 
                          onChange={(e) => setAccount({ ...account, firstName: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>LAST NAME</label>
                        <input 
                          type="text" 
                          value={account.lastName} 
                          onChange={(e) => setAccount({ ...account, lastName: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>ADMIN EMAIL</label>
                      <input 
                        type="email" 
                        value={account.email} 
                        onChange={(e) => setAccount({ ...account, email: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>ADMIN PHONE</label>
                      <input 
                        type="text" 
                        value={account.phone} 
                        onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Security</h3>
                  <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                    <div className={styles.fieldGroup}>
                      <label>CURRENT PASSWORD</label>
                      <input type="password" name="current-password" placeholder="••••••••" className={styles.input} autoComplete="current-password" />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>NEW PASSWORD</label>
                      <input type="password" name="new-password" placeholder="••••••••" className={styles.input} autoComplete="new-password" />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>CONFIRM PASSWORD</label>
                      <input type="password" name="confirm-password" placeholder="••••••••" className={styles.input} autoComplete="new-password" />
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
          )}

          {activeTab === 'branding' && (
            <div className={styles.tabContent}>
              <div className={styles.brandingGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Scheduling Defaults</h3>
                  <div className={styles.form}>
                    <div className={styles.row3}>
                      <div className={styles.fieldGroup}>
                        <label>DEFAULT TIME ZONE</label>
                        <select 
                          className={styles.select}
                          value={scheduling.timezone}
                          onChange={(e) => setScheduling({ ...scheduling, timezone: e.target.value })}
                        >
                          <option>America/New_York</option>
                          <option>Asia/Kolkata</option>
                          <option>Europe/London</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>DEFAULT CLASS DURATION</label>
                        <select 
                          className={styles.select}
                          value={scheduling.duration}
                          onChange={(e) => setScheduling({ ...scheduling, duration: e.target.value })}
                        >
                          <option>60 Minutes</option>
                          <option>90 Minutes</option>
                          <option>120 Minutes</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>BUFFER BETWEEN CLASSES</label>
                        <select 
                          className={styles.select}
                          value={scheduling.buffer}
                          onChange={(e) => setScheduling({ ...scheduling, buffer: e.target.value })}
                        >
                          <option>0 Minutes</option>
                          <option>15 Minutes</option>
                          <option>30 Minutes</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>DEFAULT WORKING DAYS</label>
                      <div className={styles.dayPills}>
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                          <button 
                            key={day} 
                            type="button"
                            className={`${styles.dayPill} ${scheduling.workingDays.includes(day) ? styles.activeDay : ''}`}
                            onClick={() => {
                              const newDays = scheduling.workingDays.includes(day)
                                ? scheduling.workingDays.filter(d => d !== day)
                                : [...scheduling.workingDays, day];
                              setScheduling({ ...scheduling, workingDays: newDays });
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>DEFAULT START TIME SLOTS (COMMA SEPARATED)</label>
                      <input 
                        type="text" 
                        value={scheduling.startSlots} 
                        onChange={(e) => setScheduling({ ...scheduling, startSlots: e.target.value })}
                        className={styles.input} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className={styles.brandingRow}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <Palette size={18} /> Branding
                    </h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>PRIMARY BRAND COLOR</label>
                        <div className={styles.colorGrid}>
                          {['#551e19', '#3D1A0E', '#2563eb', '#10b981', '#f59e0b'].map(color => (
                            <div 
                              key={color}
                              className={`${styles.colorItem} ${branding.primaryColor === color ? styles.activeColor : ''}`}
                              onClick={() => setBranding({ ...branding, primaryColor: color })}
                            >
                              <div className={styles.colorBox} style={{ backgroundColor: color }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>HEADING FONT</label>
                        <select 
                          className={styles.select}
                          value={branding.headingFont}
                          onChange={(e) => setBranding({ ...branding, headingFont: e.target.value })}
                        >
                          <option>DM Sans (Default)</option>
                          <option>Playfair Display</option>
                          <option>Montserrat</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>BODY FONT</label>
                        <select 
                          className={styles.select}
                          value={branding.bodyFont}
                          onChange={(e) => setBranding({ ...branding, bodyFont: e.target.value })}
                        >
                          <option>Inter (Default)</option>
                          <option>Poppins</option>
                          <option>Roboto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={styles.previewCard} style={{ fontFamily: branding.bodyFont === 'Inter (Default)' ? 'Inter' : branding.bodyFont }}>
                    <div className={styles.previewContent}>
                      <h2 className={styles.previewHeading} style={{ fontFamily: branding.headingFont === 'DM Sans (Default)' ? 'DM Sans' : branding.headingFont, color: branding.primaryColor }}>Typography & Color Preview</h2>
                      <p className={styles.previewText}>
                        This is how your academy's content will look. The heading font 
                        captures attention, while the body font ensures readability for 
                        your students and staff.
                      </p>
                      <div className={styles.previewButtons}>
                        <Button className={styles.previewPrimary} style={{ background: branding.primaryColor }}>Primary Button</Button>
                        <Button variant="outline" className={styles.previewSecondary}>Secondary</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

