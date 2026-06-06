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
    pieceTheme: 'cburnett',
    boardFrameColor: '#FDF0E4',
    boardFramePadding: 10
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
              pieceTheme: data.pieceTheme || 'cburnett',
              boardFrameColor: data.boardFrameColor || '#FDF0E4',
              boardFramePadding: data.boardFramePadding ?? 10
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
              pieceTheme: data.pieceTheme || 'cburnett',
              boardFrameColor: data.boardFrameColor || '#FDF0E4',
              boardFramePadding: data.boardFramePadding ?? 10
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

                    {/* Board Frame Customization */}
                    <div className={styles.frameSettingsSection}>
                      <h4 className={styles.frameSectionTitle}>🖼️ Board Frame</h4>
                      <div className={styles.frameSettingsRow}>
                        
                        {/* Frame Color */}
                        <div className={styles.frameColorGroup}>
                          <label className={styles.frameSubLabel}>Frame Color</label>
                          <div className={styles.frameColorGrid}>
                            {[
                              { id: '#5C4033', name: 'Walnut Brown' },
                              { id: '#3B2A22', name: 'Espresso' },
                              { id: '#A67C52', name: 'Oak' },
                              { id: '#4B5563', name: 'Slate' },
                              { id: '#1F2937', name: 'Charcoal' },
                              { id: '#FDF0E4', name: 'Cream' },
                              { id: '#2D4A6B', name: 'Navy' },
                              { id: '#C8854A', name: 'Caramel' },
                              { id: '#355E3B', name: 'Forest Green' },
                              { id: '#6B2C3A', name: 'Burgundy' },
                            ].map(fc => (
                              <div
                                key={fc.id}
                                className={`${styles.frameColorItem} ${branding.boardFrameColor === fc.id ? styles.activeFrameColor : ''}`}
                                onClick={() => setBranding({ ...branding, boardFrameColor: fc.id })}
                                title={fc.name}
                              >
                                <div className={styles.frameColorSwatch} style={{ backgroundColor: fc.id }} />
                                <span className={styles.frameColorName}>{fc.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Frame Padding + Preview */}
                        <div className={styles.framePaddingGroup}>
                          <label className={styles.frameSubLabel}>Frame Padding</label>
                          <div className={styles.sliderRow}>
                            <input
                              type="range"
                              min={0}
                              max={32}
                              step={2}
                              value={branding.boardFramePadding}
                              onChange={(e) => setBranding({ ...branding, boardFramePadding: Number(e.target.value) })}
                              className={styles.paddingSlider}
                            />
                            <span className={styles.paddingValue}>{branding.boardFramePadding}px</span>
                          </div>
                          {/* Live mini-preview */}
                          <div className={styles.framePreviewLabel}>Preview</div>
                          <div 
                            className={styles.frameMiniPreview}
                            style={{
                              backgroundColor: branding.boardFrameColor,
                              padding: `${branding.boardFramePadding}px`,
                            }}
                          >
                            <div className={styles.frameMiniBoard}>
                              {[0,1,2,3].map(i => (
                                <div key={i} style={{
                                  backgroundColor: i % 2 === 0 ? '#eedcd0' : '#c8854a',
                                  width: '100%', height: '100%'
                                }} />
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Board Theme Selection */}
                    <div className={styles.fieldGroup}>
                      <label>Chess Board Color Theme</label>
                      

                      {/* Classic Flat Themes */}
                      <div className={styles.themeCategory}>
                        <span className={styles.themeCategoryLabel}>🎨 Classic</span>
                        <div className={styles.boardThemeGrid}>
                          {[
                            { id: 'brown', name: 'Brown', light: '#eedcd0', dark: '#c8854a' },
                            { id: 'blue', name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
                            { id: 'green', name: 'Green', light: '#ffffdd', dark: '#86a666' },
                            { id: 'grey', name: 'Grey', light: '#e3e3e3', dark: '#a6a6a6' },
                            { id: 'purple', name: 'Purple', light: '#d2c3db', dark: '#887295' },
                            { id: 'olive', name: 'Olive', light: '#e0e0c0', dark: '#809070' },
                            { id: 'pink', name: 'Pink', light: '#fdf5ea', dark: '#e47070' },
                          ].map(theme => (
                            <div 
                              key={theme.id}
                              className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                              onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                            >
                              <div className={styles.boardPreviewBox}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
                                  <div style={{ backgroundColor: theme.light }} />
                                  <div style={{ backgroundColor: theme.dark }} />
                                  <div style={{ backgroundColor: theme.dark }} />
                                  <div style={{ backgroundColor: theme.light }} />
                                </div>
                              </div>
                              <span className={styles.boardName}>{theme.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Wood Grain Themes */}
                      <div className={styles.themeCategory}>
                        <span className={styles.themeCategoryLabel}>🪵 Wood Grain</span>
                        <div className={styles.boardThemeGrid}>
                          {[
                            { id: 'wood_maple', name: 'Maple', image: 'https://lichess1.org/assets/images/board/maple.jpg' },
                            { id: 'wood_maple2', name: 'Maple II', image: 'https://lichess1.org/assets/images/board/maple2.jpg' },
                            { id: 'wood_mahogany', name: 'Mahogany', image: 'https://lichess1.org/assets/images/board/wood.jpg' },
                            { id: 'wood_birch', name: 'Birch', image: 'https://lichess1.org/assets/images/board/wood2.jpg' },
                            { id: 'wood_walnut', name: 'Walnut', image: 'https://lichess1.org/assets/images/board/wood3.jpg' },
                            { id: 'wood_dark', name: 'Dark Wood', image: 'https://lichess1.org/assets/images/board/wood4.jpg' },
                            { id: 'wood_olive', name: 'Olive Wood', image: 'https://lichess1.org/assets/images/board/olive.jpg' },
                          ].map(theme => (
                            <div 
                              key={theme.id}
                              className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                              onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                            >
                              <div 
                                className={styles.boardPreviewBox}
                                style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                              />
                              <span className={styles.boardName}>{theme.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Marble & Stone Themes */}
                      <div className={styles.themeCategory}>
                        <span className={styles.themeCategoryLabel}>🪨 Marble & Stone</span>
                        <div className={styles.boardThemeGrid}>
                          {[
                            { id: 'marble_green', name: 'Green Marble', image: 'https://lichess1.org/assets/images/board/marble.jpg' },
                            { id: 'marble_blue', name: 'Blue Marble', image: 'https://lichess1.org/assets/images/board/blue-marble.jpg' },
                          ].map(theme => (
                            <div 
                              key={theme.id}
                              className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                              onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                            >
                              <div 
                                className={styles.boardPreviewBox}
                                style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                              />
                              <span className={styles.boardName}>{theme.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Other Materials */}
                      <div className={styles.themeCategory}>
                        <span className={styles.themeCategoryLabel}>✨ Other Materials</span>
                        <div className={styles.boardThemeGrid}>
                          {[
                            { id: 'metal', name: 'Metal', image: 'https://lichess1.org/assets/images/board/metal.jpg' },
                            { id: 'leather', name: 'Leather', image: 'https://lichess1.org/assets/images/board/leather.jpg' },
                            { id: 'canvas', name: 'Canvas', image: 'https://lichess1.org/assets/images/board/canvas2.jpg' },
                            { id: 'grey_cb', name: 'Grey', image: 'https://lichess1.org/assets/images/board/grey.jpg' },
                            { id: 'blue_cb', name: 'Blue', image: 'https://lichess1.org/assets/images/board/blue2.jpg' },
                            { id: 'purple_diag', name: 'Purple', image: 'https://lichess1.org/assets/images/board/purple-diag.png' },
                          ].map(theme => (
                            <div 
                              key={theme.id}
                              className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                              onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                            >
                              <div 
                                className={styles.boardPreviewBox}
                                style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                              />
                              <span className={styles.boardName}>{theme.name}</span>
                            </div>
                          ))}
                        </div>
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

