import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HiXMark,
  HiMagnifyingGlass,
  HiChevronLeft,
  HiChevronRight,
  HiArrowLeft,
  HiSparkles,
  HiCheck,
  HiClipboardDocument,
  HiPlusCircle,
  HiBookmark,
  HiOutlineDocumentText,
  HiOutlineRectangleStack,
  HiArrowTrendingUp
} from 'react-icons/hi2';
import { FaBookQuran } from 'react-icons/fa6';

// Popular & spiritually significant Surahs for quick one-tap filter
const QUICK_SURAHS = [
  { number: 1, name: 'Al-Faatiha' },
  { number: 18, name: 'Al-Kahf' },
  { number: 36, name: 'Yaseen' },
  { number: 55, name: 'Ar-Rahmaan' },
  { number: 56, name: 'Al-Waaqia' },
  { number: 67, name: 'Al-Mulk' },
  { number: 112, name: 'Al-Ikhlaas' },
  { number: 113, name: 'Al-Falaq' },
  { number: 114, name: 'An-Naas' }
];

export default function QuranModal({ isOpen, onClose, onAddDhikrFromAyah }) {
  const [surahsIndex, setSurahsIndex] = useState([]);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(null);
  const [currentSurahData, setCurrentSurahData] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [targetAyahPosition, setTargetAyahPosition] = useState(null); // 'first' | 'last' | number
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Meccan' | 'Medinan'
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [viewMode, setViewMode] = useState('ayah'); // 'ayah' (Ayat-by-Ayat) | 'surah' (Full Surah)
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpAyahInput, setJumpAyahInput] = useState('');

  // Reading display preferences
  const [showTranslation, setShowTranslation] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_show_translation');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showTransliteration, setShowTransliteration] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_show_translit');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_arabic_size');
      return saved ? Number(saved) : 28;
    } catch {
      return 28;
    }
  });

  // In-memory cache for loaded surahs
  const cacheRef = useRef(new Map());
  const contentContainerRef = useRef(null);

  // 1. Load the 114 Surahs index on mount
  useEffect(() => {
    if (!isOpen) return;

    if (surahsIndex.length === 0) {
      fetch('/data/quran/surahs.json')
        .then(res => res.json())
        .then(data => {
          setSurahsIndex(data);
        })
        .catch(err => {
          console.error('Failed to load Quran index', err);
        });
    }
  }, [isOpen, surahsIndex.length]);

  // 2. Load individual Surah when selected
  useEffect(() => {
    if (!selectedSurahNumber) {
      setCurrentSurahData(null);
      setCurrentAyahIndex(0);
      return;
    }

    const applySurahData = (data) => {
      setCurrentSurahData(data);
      if (targetAyahPosition === 'last') {
        setCurrentAyahIndex(Math.max(0, data.ayahs.length - 1));
      } else if (typeof targetAyahPosition === 'number') {
        setCurrentAyahIndex(Math.min(data.ayahs.length - 1, Math.max(0, targetAyahPosition)));
      } else {
        setCurrentAyahIndex(0);
      }
      setTargetAyahPosition(null);
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTop = 0;
      }
    };

    if (cacheRef.current.has(selectedSurahNumber)) {
      applySurahData(cacheRef.current.get(selectedSurahNumber));
      return;
    }

    setIsLoading(true);
    fetch(`/data/quran/surahs/${selectedSurahNumber}.json`)
      .then(res => res.json())
      .then(data => {
        cacheRef.current.set(selectedSurahNumber, data);
        applySurahData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load Surah ${selectedSurahNumber}`, err);
        setIsLoading(false);
      });
  }, [selectedSurahNumber, targetAyahPosition]);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_show_translation', JSON.stringify(showTranslation));
    } catch (e) {
      // Ignored
    }
  }, [showTranslation]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_show_translit', JSON.stringify(showTransliteration));
    } catch (e) {
      // Ignored
    }
  }, [showTransliteration]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_arabic_size', arabicFontSize.toString());
    } catch (e) {
      // Ignored
    }
  }, [arabicFontSize]);

  // Active Ayah Object
  const currentAyah = useMemo(() => {
    if (!currentSurahData || !currentSurahData.ayahs) return null;
    return currentSurahData.ayahs[currentAyahIndex] || currentSurahData.ayahs[0];
  }, [currentSurahData, currentAyahIndex]);

  // Navigation handlers
  const handlePrevAyah = useCallback(() => {
    if (!currentSurahData) return;

    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (selectedSurahNumber > 1) {
      // Move to previous Surah, last Ayah
      setTargetAyahPosition('last');
      setSelectedSurahNumber(prev => prev - 1);
    }
  }, [currentSurahData, currentAyahIndex, selectedSurahNumber]);

  const handleNextAyah = useCallback(() => {
    if (!currentSurahData) return;

    if (currentAyahIndex < currentSurahData.ayahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (selectedSurahNumber < 114) {
      // Move to next Surah, first Ayah
      setTargetAyahPosition('first');
      setSelectedSurahNumber(prev => prev + 1);
    }
  }, [currentSurahData, currentAyahIndex, selectedSurahNumber]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    if (!isOpen || !selectedSurahNumber) return;

    const handleKeyDown = (e) => {
      // Avoid intercepting input fields
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextAyah();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevAyah();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedSurahNumber, handleNextAyah, handlePrevAyah]);

  // Filtered Surahs index
  const filteredSurahs = useMemo(() => {
    return surahsIndex.filter(surah => {
      const matchesFilter = filterType === 'all' || surah.revelationType === filterType;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const numMatch = surah.number.toString() === q;
      const engNameMatch = surah.englishName.toLowerCase().includes(q);
      const transMatch = surah.englishNameTranslation.toLowerCase().includes(q);
      const arabicMatch = surah.name.includes(q);

      return numMatch || engNameMatch || transMatch || arabicMatch;
    });
  }, [surahsIndex, filterType, searchQuery]);

  // Copy Ayah text helper with full metadata
  const handleCopyAyah = (ayah, e) => {
    if (e) e.stopPropagation();
    if (!ayah || !currentSurahData) return;

    const sajdaText = ayah.sajda ? (ayah.sajda.obligatory ? ' [Sajdah Wajib]' : ' [Sajdah Recommended]') : '';
    const textToCopy = `${ayah.arabic}\n\n${ayah.transliteration}\n\n"${ayah.translation}"\n\n— Surah ${currentSurahData.englishName} (${currentSurahData.name}) ${currentSurahData.number}:${ayah.numberInSurah} • Juz ${ayah.juz} • Page ${ayah.page} • Ruku ${ayah.ruku}${sajdaText}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    });
  };

  // Turn Ayah into a Dhikr counter
  const handleMakeDhikr = (ayah, e) => {
    if (e) e.stopPropagation();
    if (onAddDhikrFromAyah && currentSurahData && ayah) {
      onAddDhikrFromAyah({
        title: `${currentSurahData.englishName} : ${ayah.numberInSurah}`,
        arabic: ayah.arabic,
        meaning: ayah.translation,
        category: 'Quranic Ayah',
        target: 33
      });
      onClose();
    }
  };

  // Jump to specific Ayah
  const handleJumpSubmit = (e) => {
    e.preventDefault();
    if (!currentSurahData) return;
    const num = parseInt(jumpAyahInput, 10);
    if (!isNaN(num) && num >= 1 && num <= currentSurahData.ayahs.length) {
      setCurrentAyahIndex(num - 1);
      setIsJumpOpen(false);
      setJumpAyahInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content quran-modal"
        onClick={e => e.stopPropagation()}
        ref={contentContainerRef}
      >
        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <div className="modal-header quran-modal-header">
          <div className="quran-header-left">
            {selectedSurahNumber ? (
              <button
                className="quran-back-btn"
                onClick={() => {
                  setSelectedSurahNumber(null);
                  setCurrentAyahIndex(0);
                }}
                title="Return to Surah list"
              >
                <HiArrowLeft />
                <span>Surahs</span>
              </button>
            ) : (
              <div className="brand-icon-box quran-icon-box">
                <FaBookQuran />
              </div>
            )}
            <div>
              <h3 className="modal-title">
                {selectedSurahNumber && currentSurahData
                  ? `${currentSurahData.number}. ${currentSurahData.englishName}`
                  : 'The Noble Quran • القرآن الكريم'}
              </h3>
              <p className="quran-header-subtitle">
                {selectedSurahNumber && currentSurahData
                  ? `${currentSurahData.englishNameTranslation} • ${currentSurahData.revelationType} • ${currentSurahData.numberOfAyahs} Ayahs`
                  : 'Complete 114 Surahs with Arabic, English Translation & Transliteration'}
              </p>
            </div>
          </div>

          <button className="close-modal-btn" onClick={onClose} aria-label="Close Quran Reader">
            <HiXMark />
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SURAH EXPLORER / INDEX LIST                       */}
        {/* ========================================================= */}
        {!selectedSurahNumber && (
          <div className="quran-explorer">
            {/* Search and Filter Row */}
            <div className="quran-search-bar">
              <HiMagnifyingGlass className="search-icon" />
              <input
                type="text"
                placeholder="Search by Surah name (e.g. Yaseen, Mulk, Kahf, Baqara) or number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="quran-search-input"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="quran-clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <HiXMark />
                </button>
              )}
            </div>

            {/* Quick Jumps to Popular Surahs */}
            <div className="quran-quick-pills">
              <span className="quick-label">
                <HiSparkles /> Quick:
              </span>
              <div className="quick-scroll-row">
                {QUICK_SURAHS.map(item => (
                  <button
                    key={item.number}
                    className="quick-surah-chip"
                    onClick={() => {
                      setTargetAyahPosition('first');
                      setSelectedSurahNumber(item.number);
                    }}
                  >
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Tabs: All, Meccan, Medinan */}
            <div className="quran-filter-tabs">
              <button
                className={`quran-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Surahs (114)
              </button>
              <button
                className={`quran-filter-btn ${filterType === 'Meccan' ? 'active' : ''}`}
                onClick={() => setFilterType('Meccan')}
              >
                Meccan
              </button>
              <button
                className={`quran-filter-btn ${filterType === 'Medinan' ? 'active' : ''}`}
                onClick={() => setFilterType('Medinan')}
              >
                Medinan
              </button>
            </div>

            {/* 114 Surahs Grid / Cards */}
            <div className="quran-surahs-grid">
              {filteredSurahs.map(surah => (
                <div
                  key={surah.number}
                  className="surah-card"
                  onClick={() => {
                    setTargetAyahPosition('first');
                    setSelectedSurahNumber(surah.number);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="surah-num-badge">
                    <span>{surah.number}</span>
                  </div>

                  <div className="surah-meta">
                    <h4 className="surah-title-eng">{surah.englishName}</h4>
                    <p className="surah-translation">{surah.englishNameTranslation}</p>
                    <div className="surah-tags">
                      <span className="surah-tag-type">{surah.revelationType}</span>
                      <span className="surah-tag-ayahs">{surah.numberOfAyahs} Ayahs</span>
                    </div>
                  </div>

                  <div className="surah-arabic-title">
                    <span className="surah-arabic-name">{surah.name}</span>
                  </div>
                </div>
              ))}

              {filteredSurahs.length === 0 && (
                <div className="no-surah-found">
                  <p>No Surah found matching "{searchQuery}". Try searching by another name or number.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SURAH READING VIEW (AYAT-BY-AYAT AS REQUESTED)    */}
        {/* ========================================================= */}
        {selectedSurahNumber && (
          <div className="quran-reader">
            {/* Reading Preferences Control Toolbar */}
            <div className="quran-reader-toolbar">
              <div className="reader-toggles">
                {/* View Mode Toggle: Ayat-by-Ayat vs Full Surah */}
                <div className="view-mode-pill">
                  <button
                    className={`mode-btn ${viewMode === 'ayah' ? 'active' : ''}`}
                    onClick={() => setViewMode('ayah')}
                    title="Verse-by-Verse focus mode"
                  >
                    <HiOutlineDocumentText />
                    <span>Ayat Mode</span>
                  </button>
                  <button
                    className={`mode-btn ${viewMode === 'surah' ? 'active' : ''}`}
                    onClick={() => setViewMode('surah')}
                    title="Continuous Surah reading mode"
                  >
                    <HiOutlineRectangleStack />
                    <span>Full Surah</span>
                  </button>
                </div>

                <label className="reader-toggle-label">
                  <input
                    type="checkbox"
                    checked={showTransliteration}
                    onChange={e => setShowTransliteration(e.target.checked)}
                  />
                  <span>Transliteration</span>
                </label>

                <label className="reader-toggle-label">
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={e => setShowTranslation(e.target.checked)}
                  />
                  <span>Translation</span>
                </label>
              </div>

              {/* Font Size Adjuster & Surah Switcher */}
              <div className="reader-controls-right">
                <div className="font-size-adjuster" title="Arabic Font Size">
                  <button
                    className="font-btn"
                    onClick={() => setArabicFontSize(prev => Math.max(20, prev - 2))}
                    title="Smaller Arabic font"
                  >
                    A-
                  </button>
                  <span className="font-size-indicator">{arabicFontSize}px</span>
                  <button
                    className="font-btn"
                    onClick={() => setArabicFontSize(prev => Math.min(44, prev + 2))}
                    title="Larger Arabic font"
                  >
                    A+
                  </button>
                </div>

                {/* Quick Surah Switcher Dropdown */}
                <select
                  className="surah-select-dropdown"
                  value={selectedSurahNumber}
                  onChange={e => {
                    setTargetAyahPosition('first');
                    setSelectedSurahNumber(Number(e.target.value));
                  }}
                  title="Switch to another Surah"
                >
                  {surahsIndex.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.englishName} ({s.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="quran-loading-box">
                <div className="quran-loading-spinner" />
                <p>Loading recitation & verse data...</p>
              </div>
            )}

            {!isLoading && currentSurahData && currentAyah && (
              <>
                {/* ================================================= */}
                {/* MODE A: AYAT-BY-AYAT FOCUSED VIEW (PRIMARY MODE)  */}
                {/* ================================================= */}
                {viewMode === 'ayah' && (
                  <div className="ayat-focus-container">
                    {/* Top Prominent Ayah Navigation Bar */}
                    <div className="ayah-nav-header">
                      <button
                        className="ayah-nav-btn prev-btn"
                        onClick={handlePrevAyah}
                        disabled={selectedSurahNumber === 1 && currentAyahIndex === 0}
                        title="Go to Previous Verse (or press ← Left Arrow)"
                      >
                        <HiChevronLeft className="nav-arrow" />
                        <span className="nav-label">Previous Ayah</span>
                      </button>

                      {/* Middle: Ayah Position & Quick Jump Button */}
                      <div className="ayah-counter-badge">
                        <button
                          className="jump-trigger-btn"
                          onClick={() => setIsJumpOpen(prev => !prev)}
                          title="Click to jump directly to any verse number"
                        >
                          <span className="badge-highlight">Ayah {currentAyah.numberInSurah}</span>
                          <span className="badge-total">of {currentSurahData.numberOfAyahs}</span>
                        </button>

                        {isJumpOpen && (
                          <form className="jump-popover-form" onSubmit={handleJumpSubmit}>
                            <input
                              type="number"
                              min="1"
                              max={currentSurahData.numberOfAyahs}
                              placeholder={`1 - ${currentSurahData.numberOfAyahs}`}
                              value={jumpAyahInput}
                              onChange={e => setJumpAyahInput(e.target.value)}
                              className="jump-number-input"
                              autoFocus
                            />
                            <button type="submit" className="jump-go-btn">Go</button>
                          </form>
                        )}
                      </div>

                      <button
                        className="ayah-nav-btn next-btn"
                        onClick={handleNextAyah}
                        disabled={selectedSurahNumber === 114 && currentAyahIndex === currentSurahData.ayahs.length - 1}
                        title="Go to Next Verse (or press → Right Arrow)"
                      >
                        <span className="nav-label">Next Ayah</span>
                        <HiChevronRight className="nav-arrow" />
                      </button>
                    </div>

                    {/* Complete Ayah Metadata Information Card */}
                    <div className="ayah-metadata-card">
                      <div className="meta-item primary-meta">
                        <span className="meta-icon">📖</span>
                        <div className="meta-content">
                          <span className="meta-title">Surah {currentSurahData.number}: {currentSurahData.englishName}</span>
                          <span className="meta-sub">{currentSurahData.name} • {currentSurahData.englishNameTranslation}</span>
                        </div>
                      </div>

                      <div className="meta-grid">
                        <div className="meta-pill">
                          <span className="meta-lbl">AYAH</span>
                          <span className="meta-val highlight">{currentAyah.numberInSurah} / {currentSurahData.numberOfAyahs}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">QURAN VERSE</span>
                          <span className="meta-val">#{currentAyah.number} / 6236</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">PAGE</span>
                          <span className="meta-val">{currentAyah.page || '—'}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">JUZ</span>
                          <span className="meta-val">Juz {currentAyah.juz || '—'}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">RUKU</span>
                          <span className="meta-val">Ruku {currentAyah.ruku || '—'}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">MANZIL</span>
                          <span className="meta-val">Manzil {currentAyah.manzil || '—'}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">HIZB QUARTER</span>
                          <span className="meta-val">{currentAyah.hizbQuarter || '—'}</span>
                        </div>

                        <div className="meta-pill">
                          <span className="meta-lbl">REVELATION</span>
                          <span className="meta-val">{currentSurahData.revelationType}</span>
                        </div>

                        {/* Sajdah Indicator */}
                        <div className={`meta-pill ${currentAyah.sajda ? 'sajdah-active' : ''}`}>
                          <span className="meta-lbl">SAJDAH</span>
                          <span className="meta-val">
                            {currentAyah.sajda ? (
                              typeof currentAyah.sajda === 'object' && currentAyah.sajda.obligatory ? (
                                <strong style={{ color: '#f59e0b' }}>۩ Obligatory (Wajib)</strong>
                              ) : (
                                <strong style={{ color: '#10b981' }}>۩ Recommended</strong>
                              )
                            ) : (
                              'No Sajdah'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bismillah Opening if Ayah 1 (except At-Tawbah and Al-Fatihah where it's ayah 1) */}
                    {currentAyah.numberInSurah === 1 && currentSurahData.number !== 9 && currentSurahData.number !== 1 && (
                      <div className="bismillah-block ayah-bismillah">
                        <p className="bismillah-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                        {showTransliteration && (
                          <p className="bismillah-translit">Bismillaahir Rahmaanir Raheem</p>
                        )}
                        {showTranslation && (
                          <p className="bismillah-trans">In the name of Allah, the Entirely Merciful, the Especially Merciful.</p>
                        )}
                      </div>
                    )}

                    {/* Main Active Ayah Focused Display Card */}
                    <div className="focused-ayah-card">
                      {/* Action Bar */}
                      <div className="focused-card-top-actions">
                        <div className="ayah-chip-tag">
                          <span>Surah {currentSurahData.englishName} • Verse {currentAyah.numberInSurah}</span>
                        </div>

                        <div className="card-action-group">
                          <button
                            className="ayah-action-btn"
                            onClick={() => handleCopyAyah(currentAyah)}
                            title="Copy full verse text and references"
                          >
                            {copiedFeedback ? (
                              <>
                                <HiCheck style={{ color: '#10b981' }} />
                                <span style={{ color: '#10b981' }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <HiClipboardDocument />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {onAddDhikrFromAyah && (
                            <button
                              className="ayah-action-btn tasbeeh-btn"
                              onClick={() => handleMakeDhikr(currentAyah)}
                              title="Turn this verse into a Tasbeeh counter"
                            >
                              <HiPlusCircle />
                              <span>Count as Tasbeeh</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Large Quranic Arabic Text */}
                      <div
                        className="ayah-arabic-text focused-arabic"
                        style={{ fontSize: `${arabicFontSize}px` }}
                      >
                        {currentAyah.arabic}
                        <span className="ayah-end-marker"> ۝{currentAyah.numberInSurah} </span>
                      </div>

                      {/* Transliteration */}
                      {showTransliteration && currentAyah.transliteration && (
                        <div className="ayah-transliteration focused-transliteration">
                          <span className="ayah-lang-tag">TRANSLITERATION (PHONETIC READING)</span>
                          <p>{currentAyah.transliteration}</p>
                        </div>
                      )}

                      {/* English Translation */}
                      {showTranslation && currentAyah.translation && (
                        <div className="ayah-translation focused-translation">
                          <span className="ayah-lang-tag">ENGLISH TRANSLATION (SAHIH INTERNATIONAL)</span>
                          <p>{currentAyah.translation}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Floating Navigation Toolbar */}
                    <div className="ayah-bottom-nav">
                      <button
                        className="bottom-nav-btn prev-btn"
                        onClick={handlePrevAyah}
                        disabled={selectedSurahNumber === 1 && currentAyahIndex === 0}
                      >
                        <HiChevronLeft />
                        <span>Previous Ayah</span>
                      </button>

                      <div className="nav-keyboard-guide">
                        <span>Tip: Use <strong>← Left</strong> and <strong>Right →</strong> arrow keys to browse verses</span>
                      </div>

                      <button
                        className="bottom-nav-btn next-btn"
                        onClick={handleNextAyah}
                        disabled={selectedSurahNumber === 114 && currentAyahIndex === currentSurahData.ayahs.length - 1}
                      >
                        <span>Next Ayah</span>
                        <HiChevronRight />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================================================= */}
                {/* MODE B: FULL SURAH VIEW (OPTIONAL ALTERNATIVE)    */}
                {/* ================================================= */}
                {viewMode === 'surah' && (
                  <div className="quran-surah-content">
                    {/* Surah Banner Card */}
                    <div className="surah-banner-card">
                      <h2 className="banner-arabic-title">{currentSurahData.name}</h2>
                      <h3 className="banner-english-title">
                        Surah {currentSurahData.englishName} ({currentSurahData.englishNameTranslation})
                      </h3>
                      <div className="banner-details">
                        <span>Surah #{currentSurahData.number}</span>
                        <span>•</span>
                        <span>{currentSurahData.revelationType} Revelation</span>
                        <span>•</span>
                        <span>{currentSurahData.numberOfAyahs} Verses</span>
                      </div>

                      {currentSurahData.number !== 9 && currentSurahData.number !== 1 && (
                        <div className="bismillah-block">
                          <p className="bismillah-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                          {showTransliteration && (
                            <p className="bismillah-translit">Bismillaahir Rahmaanir Raheem</p>
                          )}
                          {showTranslation && (
                            <p className="bismillah-trans">In the name of Allah, the Entirely Merciful, the Especially Merciful.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ayahs List */}
                    <div className="ayahs-list">
                      {currentSurahData.ayahs.map(ayah => (
                        <div key={ayah.number} className="ayah-card">
                          <div className="ayah-card-header">
                            <div className="ayah-badge">
                              <span>Verse {ayah.numberInSurah}</span>
                              {ayah.juz && <span className="ayah-submeta">Juz {ayah.juz} • Page {ayah.page} • Ruku {ayah.ruku}</span>}
                              {ayah.sajda && (
                                <span className="sajda-tag">۩ Sajdah</span>
                              )}
                            </div>

                            <div className="ayah-actions">
                              <button
                                className="ayah-action-btn"
                                onClick={e => handleCopyAyah(ayah, e)}
                                title="Copy Ayah text"
                              >
                                <HiClipboardDocument />
                                <span>Copy</span>
                              </button>

                              {onAddDhikrFromAyah && (
                                <button
                                  className="ayah-action-btn tasbeeh-btn"
                                  onClick={e => handleMakeDhikr(ayah, e)}
                                  title="Turn this verse into a Tasbeeh counter"
                                >
                                  <HiPlusCircle />
                                  <span>Count as Tasbeeh</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div
                            className="ayah-arabic-text"
                            style={{ fontSize: `${arabicFontSize}px` }}
                          >
                            {ayah.arabic}
                            <span className="ayah-end-marker"> ۝{ayah.numberInSurah} </span>
                          </div>

                          {showTransliteration && ayah.transliteration && (
                            <div className="ayah-transliteration">
                              <span className="ayah-lang-tag">TRANSLITERATION</span>
                              <p>{ayah.transliteration}</p>
                            </div>
                          )}

                          {showTranslation && ayah.translation && (
                            <div className="ayah-translation">
                              <span className="ayah-lang-tag">TRANSLATION (SAHIH INTERNATIONAL)</span>
                              <p>{ayah.translation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
