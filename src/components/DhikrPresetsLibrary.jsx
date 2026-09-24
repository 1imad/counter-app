import React from 'react';
import {
  HiBookOpen,
  HiXMark,
  HiPlus
} from 'react-icons/hi2';

export const SUNNAH_DHIKR_PRESETS = [
  {
    title: 'SubhanAllah',
    arabic: 'سُبْحَانَ ٱللَّٰهِ',
    meaning: 'Glory be to Allah',
    category: 'Tasbeeh Fatimah',
    target: 33,
    step: 1,
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    title: 'Alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    meaning: 'All praise is due to Allah',
    category: 'Tasbeeh Fatimah',
    target: 33,
    step: 1,
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  {
    title: 'Allahu Akbar',
    arabic: 'ٱللَّٰهُ أَكْبَرُ',
    meaning: 'Allah is the Greatest',
    category: 'Tasbeeh Fatimah',
    target: 34,
    step: 1,
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)'
  },
  {
    title: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    meaning: 'I seek forgiveness from Allah',
    category: 'Istighfar',
    target: 100,
    step: 1,
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    title: 'La ilaha illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    meaning: 'There is no deity worthy of worship except Allah',
    category: 'Tahlil',
    target: 100,
    step: 1,
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  {
    title: 'Salawat on Prophet ﷺ',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    meaning: 'O Allah, send blessings upon Muhammad and his family',
    category: 'Durood',
    target: 100,
    step: 1,
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)'
  },
  {
    title: 'SubhanAllahi wa Bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    meaning: 'Glory be to Allah and His is the praise; Glory be to Allah the Supreme',
    category: 'Treasures of Jannah',
    target: 100,
    step: 1,
    accentColor: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.4)'
  },
  {
    title: 'HasbunAllahu wa Ni\'mal Wakeel',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    meaning: 'Allah is sufficient for us, and He is the best Disposer of affairs',
    category: 'Reliance on Allah',
    target: 100,
    step: 1,
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)'
  },
  {
    title: 'La Hawla wa La Quwwata',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    meaning: 'There is no power and no strength except with Allah',
    category: 'Treasure of Paradise',
    target: 100,
    step: 1,
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)'
  }
];

export default function DhikrPresetsLibrary({ isOpen = true, onClose, onAddPreset, isPage = true }) {
  if (!isOpen && !isPage) return null;

  return (
    <div className={isPage ? "page-view-container" : "modal-backdrop"} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? "page-view-card presets-modal" : "modal-content presets-modal"} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <HiBookOpen />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Sunnah Adhkar Library</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Select authentic Zikr & Askar to add to your counters
              </p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Presets">
            <HiXMark />
          </button>
        </div>

        <div className="presets-list">
          {SUNNAH_DHIKR_PRESETS.map((preset, index) => (
            <div key={index} className="preset-item-card">
              <div className="preset-item-header">
                <div>
                  <span className="preset-cat">{preset.category}</span>
                  <h4 className="preset-name">{preset.title}</h4>
                </div>
                <button
                  className="add-preset-btn"
                  onClick={() => {
                    onAddPreset(preset);
                  }}
                  title="Add to my counters"
                >
                  <HiPlus /> Add
                </button>
              </div>

              <p className="preset-arabic">{preset.arabic}</p>
              <p className="preset-meaning">{preset.meaning}</p>

              <div className="preset-meta-footer">
                <span>Target: <strong>{preset.target}x</strong></span>
                <span>Step: <strong>±{preset.step}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
