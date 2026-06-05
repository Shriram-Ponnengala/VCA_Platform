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
import { Button } from '@vca/ui';
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
    primaryColor: '#551e19',
    boardTheme: 'brown',
    pieceTheme: 'cburnett'
  });

  useEffect(() => {
    const loadSettings = async () => {
      let loadedProfile = false;
      let loadedAccount = false;
      let loadedScheduling = false;
      let loadedBranding = false;

      try {
        const [resProfile, resAccount, resScheduling, resBranding] = await Promise.all([
          fetch('/api/settings/profile', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/account', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/scheduling', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/branding', { cache: 'no-store' }).catch(() => null)
        ]);
        
        if (resProfile?.ok) { const data = await resProfile.json(); if (data) { setProfile(data); loadedProfile = true; } }
        if (resAccount?.ok) { const data = await resAccount.json(); if (data) { setAccount(data); loadedAccount = true; } }
        if (resScheduling?.ok) { const data = await resScheduling.json(); if (data) { setScheduling(data); loadedScheduling = true; } }
        if (resBranding?.ok) {
          const data = await resBranding.json();
          if (data) {
            setBranding({
              headingFont: data.headingFont || 'DM Sans (Default)',
              bodyFont: data.bodyFont || 'Inter (Default)',
              primaryColor: data.primaryColor || '#551e19',
              boardTheme: data.boardTheme || 'brown',
              pieceTheme: data.pieceTheme || 'cburnett'
            });
            loadedBranding = true;
          }
        }
      } catch (e) {
        console.error('Failed to load global settings', e);
      }
      
      if (!loadedProfile) { const stored = localStorage.getItem('vca_settings_profile'); if (stored) setProfile(JSON.parse(stored)); }
      if (!loadedAccount) { const stored = localStorage.getItem('vca_settings_account'); if (stored) setAccount(JSON.parse(stored)); }
      if (!loadedScheduling) { const stored = localStorage.getItem('vca_settings_scheduling'); if (stored) setScheduling(JSON.parse(stored)); }
      if (!loadedBranding) {
        const stored = localStorage.getItem('vca_settings_branding');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setBranding({
              headingFont: data.headingFont || 'DM Sans (Default)',
              bodyFont: data.bodyFont || 'Inter (Default)',
              primaryColor: data.primaryColor || '#551e19',
              boardTheme: data.boardTheme || 'brown',
              pieceTheme: data.pieceTheme || 'cburnett'
            });
          } catch (e) {}
        }
      }
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    localStorage.setItem('vca_settings_profile', JSON.stringify(profile));
    localStorage.setItem('vca_settings_account', JSON.stringify(account));
    localStorage.setItem('vca_settings_scheduling', JSON.stringify(scheduling));
    localStorage.setItem('vca_settings_branding', JSON.stringify(branding));
    
    try {
      await Promise.all([
        fetch('/api/settings/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }),
        fetch('/api/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) }),
        fetch('/api/settings/scheduling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduling) }),
        fetch('/api/settings/branding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branding) })
      ]);
    } catch (e) {
      console.error('Failed to save settings globally', e);
    }
    
    // Dispatch event to update globally immediately in current window
    window.dispatchEvent(new Event('vca-branding-updated'));
    
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
              <span>Other Settings</span>
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
                
                <div className={styles.brandingRow}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <Palette size={18} /> Branding
                    </h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>PRIMARY BRAND COLOR</label>
                        <div className={styles.colorGrid}>
                          {['#551e19', '#3D1A0E', '#2d4a6b', '#10b981', '#f59e0b'].map(color => (
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
                          <option>Open Sans</option>
                          <option>Oleo Script</option>
                          <option>Lato</option>
                          <option>Merriweather</option>
                          <option>Nunito</option>
                          <option>Poppins</option>
                          <option>Roboto</option>
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
                          <option>Open Sans</option>
                          <option>Lato</option>
                          <option>Merriweather</option>
                          <option>Nunito</option>
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
                        <Button 
                          variant="secondary" 
                          className={styles.previewSecondary}
                          style={{ color: branding.primaryColor, borderColor: branding.primaryColor }}
                        >
                          Secondary
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chess Board & Pieces Card */}
                <div className={styles.chessSettingsCard}>
                  <h3 className={styles.cardTitle}>
                    <Layout size={18} /> Chess Board & Pieces
                  </h3>
                  <div className={styles.chessSettingsGrid}>
                    {/* Left side: Board Theme Selection */}
                    <div className={styles.fieldGroup}>
                      <label>Chess Board Color Theme</label>
                      <div className={styles.boardThemeGrid}>
                        {[
                          { id: 'brown', name: 'classic', light: '#eedcd0', dark: '#c8854a' },
                          { id: 'blue', name: 'blue', light: '#dee3e6', dark: '#8ca2ad' },
                          { id: 'green', name: 'green', light: '#ffffdd', dark: '#86a666' },
                          { id: 'purple', name: 'purple', light: '#d2c3db', dark: '#887295' },
                          { id: 'olive', name: 'olive', light: '#e0e0c0', dark: '#809070' },
                          { id: 'grey', name: 'grey', light: '#e3e3e3', dark: '#a6a6a6' },
                          { id: 'wood', name: 'wood', light: '#e9d3b4', dark: '#a06a42' },
                          { id: 'pink', name: 'pink', light: '#fdf5ea', dark: '#e47070' },
                        ].map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div className={styles.boardPreviewBox}>
                              <div style={{ backgroundColor: theme.light }} />
                              <div style={{ backgroundColor: theme.dark }} />
                              <div style={{ backgroundColor: theme.dark }} />
                              <div style={{ backgroundColor: theme.light }} />
                            </div>
                            <span className={styles.boardName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right side: Piece Selection */}
                    <div className={styles.fieldGroup}>
                      <label>Chess Piece Style</label>
                      <div className={styles.pieceStyleGrid}>
                        {[
                          { id: 'cburnett', name: 'cburnett' },
                          { id: 'merida', name: 'merida' },
                          { id: 'alpha', name: 'alpha' },
                          { id: 'staunty', name: 'staunty' },
                          { id: 'pixel', name: 'pixel' },
                          { id: 'letter', name: 'letter' },
                        ].map(pieceSet => (
                          <div 
                            key={pieceSet.id}
                            className={`${styles.pieceItem} ${branding.pieceTheme === pieceSet.id ? styles.activePiece : ''}`}
                            onClick={() => setBranding({ ...branding, pieceTheme: pieceSet.id })}
                          >
                            <div 
                              className={styles.piecePreview} 
                              style={{ backgroundImage: `url(https://lichess1.org/assets/_L5MIdy/piece/${pieceSet.id}/wN.svg)` }} 
                            />
                            <span className={styles.pieceName}>{pieceSet.name}</span>
                          </div>
                        ))}
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

