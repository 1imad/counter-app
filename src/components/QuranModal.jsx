import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  HiAdjustmentsHorizontal,
  HiBookmark
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Meccan' | 'Medinan'
  const [copiedAyahNum, setCopiedAyahNum] = useState(null);

  // Reading display preferences (persisted in localStorage)
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
      return saved ? Number(saved) : 26;
    } catch {
      return 26;
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
      return;
    }

    // Check in-memory cache
    if (cacheRef.current.has(selectedSurahNumber)) {
      setCurrentSurahData(cacheRef.current.get(selectedSurahNumber));
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTop = 0;
      }
      return;
    }

    setIsLoading(true);
    fetch(`/data/quran/surahs/${selectedSurahNumber}.json`)
      .then(res => res.json())
      .then(data => {
        cacheRef.current.set(selectedSurahNumber, data);
        setCurrentSurahData(data);
        setIsLoading(false);
        if (contentContainerRef.current) {
          contentContainerRef.current.scrollTop = 0;
        }
      })
      .catch(err => {
        console.error(`Failed to load Surah ${selectedSurahNumber}`, err);
        setIsLoading(false);
      });
  }, [selectedSurahNumber]);

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

  // Copy Ayah text helper
  const handleCopyAyah = (ayah, e) => {
    e.stopPropagation();
    const textToCopy = `${ayah.arabic}\n\n${ayah.transliteration}\n\n"${ayah.translation}"\n(Surah ${currentSurahData.englishName} ${currentSurahData.number}:${ayah.numberInSurah})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedAyahNum(ayah.numberInSurah);
      setTimeout(() => setCopiedAyahNum(null), 2000);
    });
  };

  // Turn Ayah into a Dhikr counter
  const handleMakeDhikr = (ayah, e) => {
    e.stopPropagation();
    if (onAddDhikrFromAyah) {
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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content quran-modal"
        onClick={e => e.stopPropagation()}
        ref={contentContainerRef}
      >
        {/* Header Bar */}
        <div className="modal-header quran-modal-header">
          <div className="quran-header-left">
            {selectedSurahNumber ? (
              <button
                className="quran-back-btn"
                onClick={() => setSelectedSurahNumber(null)}
                title="Return to Surah list"
              >
                <HiArrowLeft />
                <span>All Surahs</span>
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
                placeholder="Search by Surah name (e.g., Yaseen, Mulk, Kahf) or number..."
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
                    onClick={() => setSelectedSurahNumber(item.number)}
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
                  onClick={() => setSelectedSurahNumber(surah.number)}
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
        {/* VIEW 2: SURAH READING VIEW                                */}
        {/* ========================================================= */}
        {selectedSurahNumber && (
          <div className="quran-reader">
            {/* Reading Preferences Control Toolbar */}
            <div className="quran-reader-toolbar">
              <div className="reader-toggles">
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
                  <span>English Translation</span>
                </label>
              </div>

              {/* Font Size Adjuster & Navigation */}
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
                    onClick={() => setArabicFontSize(prev => Math.min(42, prev + 2))}
                    title="Larger Arabic font"
                  >
                    A+
                  </button>
                </div>

                {/* Prev / Next Surah Quick Jump */}
                <div className="surah-pager-btns">
                  <button
                    className="pager-nav-btn"
                    disabled={selectedSurahNumber <= 1}
                    onClick={() => setSelectedSurahNumber(prev => Math.max(1, prev - 1))}
                    title="Previous Surah"
                  >
                    <HiChevronLeft />
                  </button>
                  <button
                    className="pager-nav-btn"
                    disabled={selectedSurahNumber >= 114}
                    onClick={() => setSelectedSurahNumber(prev => Math.min(114, prev + 1))}
                    title="Next Surah"
                  >
                    <HiChevronRight />
                  </button>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="quran-loading-box">
                <div className="quran-loading-spinner" />
                <p>Loading Surah recitation text...</p>
              </div>
            )}

            {!isLoading && currentSurahData && (
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

                  {/* Bismillah Banner (All Surahs except At-Tawbah #9 and Al-Fatihah #1 where it is Ayah 1) */}
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
                      {/* Top Bar of Ayah */}
                      <div className="ayah-card-header">
                        <div className="ayah-badge">
                          <span>Verse {ayah.numberInSurah}</span>
                          {ayah.juz && <span className="ayah-submeta">Juz {ayah.juz} • Page {ayah.page}</span>}
                        </div>

                        <div className="ayah-actions">
                          <button
                            className="ayah-action-btn"
                            onClick={e => handleCopyAyah(ayah, e)}
                            title="Copy Ayah text"
                          >
                            {copiedAyahNum === ayah.numberInSurah ? (
                              <>
                                <HiCheck style={{ color: '#10b981' }} />
                                <span style={{ color: '#10b981' }}>Copied</span>
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
                              onClick={e => handleMakeDhikr(ayah, e)}
                              title="Turn this verse into a Tasbeeh counter"
                            >
                              <HiPlusCircle />
                              <span>Count as Tasbeeh</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Arabic Quranic Script */}
                      <div
                        className="ayah-arabic-text"
                        style={{ fontSize: `${arabicFontSize}px` }}
                      >
                        {ayah.arabic}
                        <span className="ayah-end-marker"> ۝{ayah.numberInSurah} </span>
                      </div>

                      {/* English Transliteration */}
                      {showTransliteration && ayah.transliteration && (
                        <div className="ayah-transliteration">
                          <span className="ayah-lang-tag">TRANSLITERATION</span>
                          <p>{ayah.transliteration}</p>
                        </div>
                      )}

                      {/* English Translation */}
                      {showTranslation && ayah.translation && (
                        <div className="ayah-translation">
                          <span className="ayah-lang-tag">TRANSLATION (SAHIH INTERNATIONAL)</span>
                          <p>{ayah.translation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Navigation */}
                <div className="surah-footer-nav">
                  {selectedSurahNumber > 1 && (
                    <button
                      className="surah-nav-link-btn"
                      onClick={() => setSelectedSurahNumber(prev => prev - 1)}
                    >
                      <HiChevronLeft />
                      <span>Previous Surah</span>
                    </button>
                  )}

                  <button
                    className="surah-nav-link-btn"
                    onClick={() => {
                      if (contentContainerRef.current) {
                        contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>↑ Back to Top</span>
                  </button>

                  {selectedSurahNumber < 114 && (
                    <button
                      className="surah-nav-link-btn"
                      onClick={() => setSelectedSurahNumber(prev => prev + 1)}
                    >
                      <span>Next Surah</span>
                      <HiChevronRight />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
