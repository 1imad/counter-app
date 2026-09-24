import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HiXMark,
  HiMagnifyingGlass,
  HiArrowLeft,
  HiArrowRight,
  HiClipboardDocument,
  HiPlusCircle,
  HiBookmark,
  HiOutlineDocumentText,
  HiTrash,
  HiCog6Tooth,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiPlay,
  HiPause
} from 'react-icons/hi2';
import { FaBookQuran } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/audio';

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

// Clean Ayah Arabic text: removes prepended Bismillah from Ayah 1 for Surahs 2..114
const BISMILLAH_REGEX = /^[\uFEFF\s]*ب[\u064B-\u065F]*سْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰ?نِ\s+ٱلرَّحِيمِ\s*/u;

const getCleanArabicText = (arabicText, surahNumber, ayahNumberInSurah) => {
  if (!arabicText) return '';
  if (surahNumber === 1) return arabicText; // In Al-Faatiha, Bismillah is Verse 1 itself
  if (ayahNumberInSurah === 1) {
    return arabicText.replace(BISMILLAH_REGEX, '').trim();
  }
  return arabicText;
};

export default function QuranModal({ isOpen = true, onClose, onAddDhikrFromAyah, isPage = true }) {
  const navigate = useNavigate();
  const { surahId } = useParams();

  const [surahsIndex, setSurahsIndex] = useState([]);
  const [currentSurahData, setCurrentSurahData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Meccan' | 'Medinan' | 'bookmarks'
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpAyahInput, setJumpAyahInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPhase, setAudioPhase] = useState(null); // 'arabic' | 'urdu' | null
  const [playUrduAudio, setPlayUrduAudio] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_play_urdu_audio');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showUrduTranslation, setShowUrduTranslation] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_show_urdu');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [autoAdvanceAudio, setAutoAdvanceAudio] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_auto_advance');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Quran Reading Progress stored in localStorage
  const [lastRead, setLastRead] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Per-Surah progress memory (e.g. { [surahNum]: { ayahIndex, ayahNumberInSurah, totalAyahs, updatedAt } })
  const [surahProgress, setSurahProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_surah_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // View Mode stored in localStorage ('ayah' | 'surah')
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_view_mode');
      return saved === 'surah' ? 'surah' : 'ayah';
    } catch {
      return 'ayah';
    }
  });

  // Selected Surah Number initialized to resume spot if available
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(() => {
    try {
      if (surahId) {
        const num = parseInt(surahId, 10);
        if (!isNaN(num) && num >= 1 && num <= 114) return num;
      }
      const savedScreen = localStorage.getItem('noor_quran_active_screen');
      const savedRead = localStorage.getItem('noor_quran_last_read');
      if (savedRead && savedScreen !== 'explorer') {
        const parsed = JSON.parse(savedRead);
        if (parsed?.surahNumber) return parsed.surahNumber;
      }
    } catch {
      // Ignored
    }
    return 1; // Default to Surah 1 Al-Fatiha
  });

  // Target Ayah Position
  const [targetAyahPosition, setTargetAyahPosition] = useState(() => {
    try {
      const savedScreen = localStorage.getItem('noor_quran_active_screen');
      const savedRead = localStorage.getItem('noor_quran_last_read');
      if (savedRead && savedScreen !== 'explorer') {
        const parsed = JSON.parse(savedRead);
        if (typeof parsed?.ayahIndex === 'number') {
          return parsed.ayahIndex;
        }
      }
    } catch {
      // Ignored
    }
    return 0;
  });

  const [currentAyahIndex, setCurrentAyahIndex] = useState(() => {
    try {
      const savedScreen = localStorage.getItem('noor_quran_active_screen');
      const savedRead = localStorage.getItem('noor_quran_last_read');
      if (savedRead && savedScreen !== 'explorer') {
        const parsed = JSON.parse(savedRead);
        if (typeof parsed?.ayahIndex === 'number') {
          return parsed.ayahIndex;
        }
      }
    } catch {
      // Ignored
    }
    return 0;
  });

  // Bookmarks stored in localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quran_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
      return saved ? Number(saved) : 32;
    } catch {
      return 32;
    }
  });

  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const saved = localStorage.getItem('noor_quranly_daily_goal');
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });


  // In-memory cache for loaded surahs
  const cacheRef = useRef(new Map());
  const contentContainerRef = useRef(null);
  const audioRef = useRef(null);
  const isAutoPlayRef = useRef(false);
  const currentSurahDataRef = useRef(currentSurahData);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  const playAyahAudioRef = useRef(null);
  const playUrduAudioRef = useRef(playUrduAudio);

  useEffect(() => {
    currentSurahDataRef.current = currentSurahData;
  }, [currentSurahData]);

  useEffect(() => {
    currentAyahIndexRef.current = currentAyahIndex;
  }, [currentAyahIndex]);

  useEffect(() => {
    playUrduAudioRef.current = playUrduAudio;
  }, [playUrduAudio]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_play_urdu_audio', JSON.stringify(playUrduAudio));
    } catch {
      // Ignored
    }
  }, [playUrduAudio]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_show_urdu', JSON.stringify(showUrduTranslation));
    } catch {
      // Ignored
    }
  }, [showUrduTranslation]);

  // Sync route param surahId (if visiting /quran/:surahId)
  useEffect(() => {
    if (surahId) {
      const num = parseInt(surahId, 10);
      if (!isNaN(num) && num >= 1 && num <= 114) {
        setSelectedSurahNumber(num);
        try {
          localStorage.setItem('noor_quran_active_screen', 'reader');
        } catch {
          // Ignored
        }
      }
    }
  }, [surahId]);

  // Load the 114 Surahs index on mount
  useEffect(() => {
    if (!isOpen && !isPage) return;

    if (surahsIndex.length === 0) {
      fetch('/data/quran/surahs.json')
        .then(res => res.json())
        .then(data => {
          setSurahsIndex(data);
        })
        .catch(err => {
          console.error('Failed to load Quran surahs index', err);
        });
    }
  }, [isOpen, isPage, surahsIndex.length]);

  // Continuous recitation playback handler with Arabic + Urdu sequential audio tracking
  const playAyahAudio = useCallback((ayah, phase = 'arabic') => {
    if (!ayah) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    try {
      audioRef.current.pause();
    } catch {
      // Ignored
    }

    // Set active audio phase: 'arabic' or 'urdu'
    setAudioPhase(phase);
    setIsAudioLoading(true);
    setDownloadProgress(10);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    const updateBufferProgress = () => {
      const a = audioRef.current;
      if (!a) return;
      if (a.buffered && a.buffered.length > 0 && a.duration && !isNaN(a.duration) && a.duration > 0) {
        const bufferedEnd = a.buffered.end(a.buffered.length - 1);
        const pct = Math.min(100, Math.max(10, Math.round((bufferedEnd / a.duration) * 100)));
        setDownloadProgress(pct);
      }
    };

    audioRef.current.onloadstart = () => {
      setIsAudioLoading(true);
      setDownloadProgress(15);
    };

    audioRef.current.onprogress = () => {
      updateBufferProgress();
    };

    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) {
        setAudioDuration(audioRef.current.duration || 0);
        updateBufferProgress();
      }
    };

    audioRef.current.oncanplay = () => {
      setIsAudioLoading(false);
      updateBufferProgress();
    };

    audioRef.current.oncanplaythrough = () => {
      setIsAudioLoading(false);
      setDownloadProgress(100);
    };

    audioRef.current.onwaiting = () => {
      setIsAudioLoading(true);
    };

    audioRef.current.onplaying = () => {
      setIsAudioLoading(false);
      setIsAudioPlaying(true);
    };

    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setAudioCurrentTime(audioRef.current.currentTime || 0);
        if (!audioRef.current.paused) {
          setIsAudioLoading(false);
        }
        updateBufferProgress();
      }
    };

    audioRef.current.onended = () => {
      setIsAudioLoading(false);
      setDownloadProgress(0);
      setAudioCurrentTime(0);

      // If Arabic recitation just finished and Urdu audio is enabled, immediately play Urdu audio for this Ayah!
      if (phase === 'arabic' && playUrduAudioRef.current) {
        setTimeout(() => {
          playAyahAudioRef.current?.(ayah, 'urdu');
        }, 280);
        return;
      }

      // Both Arabic and Urdu (or Arabic only) completed for this Ayah
      setAudioPhase(null);

      // Verse read completed: increment daily reading counter in storage
      try {
        const current = parseInt(localStorage.getItem('noor_quranly_today_verses') || '0', 10);
        localStorage.setItem('noor_quranly_today_verses', (current + 1).toString());
      } catch {
        // Ignored
      }

      if (!isAutoPlayRef.current) {
        setIsAudioPlaying(false);
        return;
      }

      // Continuous Auto Play is active: advance to next Ayah
      const activeSurah = currentSurahDataRef.current;
      const currIdx = currentAyahIndexRef.current;

      if (!activeSurah || !activeSurah.ayahs) {
        setIsAudioPlaying(false);
        return;
      }

      if (currIdx < activeSurah.ayahs.length - 1) {
        const nextIdx = currIdx + 1;
        setCurrentAyahIndex(nextIdx);
        currentAyahIndexRef.current = nextIdx;

        setTimeout(() => {
          if (isAutoPlayRef.current && currentSurahDataRef.current) {
            playAyahAudioRef.current?.(currentSurahDataRef.current.ayahs[nextIdx], 'arabic');
          }
        }, 320);
      } else if (activeSurah.number < 114) {
        // Transition to next Surah
        const nextSurahNum = activeSurah.number + 1;
        setTargetAyahPosition('first');
        setSelectedSurahNumber(nextSurahNum);
      } else {
        // End of the Holy Quran reached
        setIsAutoPlayActive(false);
        isAutoPlayRef.current = false;
        setIsAudioPlaying(false);
      }
    };

    audioRef.current.onerror = (e) => {
      console.warn(`Recitation audio error in phase: ${phase}`, e);
      setIsAudioLoading(false);
      // If Urdu translation audio errors out, move on to next verse instead of getting stuck
      if (phase === 'arabic' && playUrduAudioRef.current) {
        playAyahAudioRef.current?.(ayah, 'urdu');
        return;
      }
      setIsAudioPlaying(false);
      setAudioPhase(null);
    };

    // Arabic audio (Sheikh Mishary Rashid Alafasy) vs Urdu audio (Shamshad Ali Khan)
    if (phase === 'urdu') {
      audioRef.current.src = `https://cdn.islamic.network/quran/audio/64/ur.khan/${ayah.number}.mp3`;
    } else {
      audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
    }

    audioRef.current.play().then(() => {
      setIsAudioPlaying(true);
      setIsAudioLoading(false);
    }).catch(err => {
      console.warn(`Audio playback start failed for ${phase}`, err);
    });
  }, []);

  useEffect(() => {
    playAyahAudioRef.current = playAyahAudio;
  }, [playAyahAudio]);

  // Helper to apply loaded Surah data
  const applySurahData = useCallback((data) => {
    setCurrentSurahData(data);
    currentSurahDataRef.current = data;

    let nextAyahIndex = 0;
    if (targetAyahPosition === 'first') {
      nextAyahIndex = 0;
    } else if (targetAyahPosition === 'last') {
      nextAyahIndex = Math.max(0, data.ayahs.length - 1);
    } else if (typeof targetAyahPosition === 'number') {
      nextAyahIndex = Math.min(Math.max(0, targetAyahPosition), data.ayahs.length - 1);
    } else if (surahProgress[data.number] && typeof surahProgress[data.number].ayahIndex === 'number') {
      nextAyahIndex = Math.min(Math.max(0, surahProgress[data.number].ayahIndex), data.ayahs.length - 1);
    }

    setCurrentAyahIndex(nextAyahIndex);
    currentAyahIndexRef.current = nextAyahIndex;
    setTargetAyahPosition(null);
    setIsLoading(false);

    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // If continuous Auto Play was active when transitioning Surahs, immediately recite the target Ayah
    if (isAutoPlayRef.current && data.ayahs && data.ayahs[nextAyahIndex]) {
      setTimeout(() => {
        if (isAutoPlayRef.current) {
          playAyahAudio(data.ayahs[nextAyahIndex], 'arabic');
        }
      }, 350);
    }
  }, [targetAyahPosition, surahProgress, playAyahAudio]);

  // Fetch active Surah details
  useEffect(() => {
    if (!selectedSurahNumber) {
      setCurrentSurahData(null);
      return;
    }

    setIsLoading(true);

    if (cacheRef.current.has(selectedSurahNumber)) {
      applySurahData(cacheRef.current.get(selectedSurahNumber));
      return;
    }

    fetch(`/data/quran/surahs/${selectedSurahNumber}.json`)
      .then(res => res.json())
      .then(data => {
        cacheRef.current.set(selectedSurahNumber, data);
        applySurahData(data);
      })
      .catch(err => {
        console.error(`Failed to load Surah ${selectedSurahNumber}`, err);
        setIsLoading(false);
      });
  }, [selectedSurahNumber, applySurahData]);

  // Save viewMode preference
  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_view_mode', viewMode);
    } catch {
      // Ignored
    }
  }, [viewMode]);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_show_translation', JSON.stringify(showTranslation));
    } catch {
      // Ignored
    }
  }, [showTranslation]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_show_translit', JSON.stringify(showTransliteration));
    } catch {
      // Ignored
    }
  }, [showTransliteration]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_arabic_size', arabicFontSize.toString());
    } catch {
      // Ignored
    }
  }, [arabicFontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_quran_auto_advance', JSON.stringify(autoAdvanceAudio));
    } catch {
      // Ignored
    }
  }, [autoAdvanceAudio]);

  // Active Ayah Object
  const currentAyah = useMemo(() => {
    if (!currentSurahData || !currentSurahData.ayahs || currentSurahData.ayahs.length === 0) {
      return null;
    }
    return currentSurahData.ayahs[currentAyahIndex] || currentSurahData.ayahs[0];
  }, [currentSurahData, currentAyahIndex]);

  // Auto-save reading progress to local storage
  const saveAyahProgress = useCallback((ayahIdx) => {
    if (!currentSurahData || !currentAyah) return;

    try {
      const progressRecord = {
        surahNumber: currentSurahData.number,
        surahEnglishName: currentSurahData.englishName,
        surahArabicName: currentSurahData.name,
        ayahNumberInSurah: currentAyah.numberInSurah,
        ayahIndex: ayahIdx,
        totalAyahs: currentSurahData.numberOfAyahs,
        page: currentAyah.page || 1,
        juz: currentAyah.juz || 1,
        viewMode,
        timestamp: Date.now()
      };

      setLastRead(progressRecord);
      localStorage.setItem('noor_quran_last_read', JSON.stringify(progressRecord));

      setSurahProgress(prev => {
        const next = {
          ...prev,
          [currentSurahData.number]: {
            ayahNumberInSurah: currentAyah.numberInSurah,
            ayahIndex: ayahIdx,
            totalAyahs: currentSurahData.numberOfAyahs,
            updatedAt: new Date().toISOString()
          }
        };
        try {
          localStorage.setItem('noor_quran_surah_progress', JSON.stringify(next));
        } catch {
          // Ignored
        }
        return next;
      });

      localStorage.setItem('noor_quran_active_screen', 'reader');
    } catch (e) {
      console.error('Failed to save Quran reading progress', e);
    }
  }, [currentSurahData, currentAyah, viewMode]);

  useEffect(() => {
    if (currentSurahData && currentAyah && targetAyahPosition === null) {
      saveAyahProgress(currentAyahIndex);
    }
  }, [currentSurahData, currentAyahIndex, currentAyah, targetAyahPosition, saveAyahProgress]);

  // Navigation handlers
  const handlePrevAyah = useCallback(() => {
    if (!currentSurahData) return;

    if (currentAyahIndex > 0) {
      const prevIdx = currentAyahIndex - 1;
      setCurrentAyahIndex(prevIdx);
      currentAyahIndexRef.current = prevIdx;
      if (isAutoPlayRef.current) {
        playAyahAudio(currentSurahData.ayahs[prevIdx], 'arabic');
      }
    } else if (selectedSurahNumber > 1) {
      setTargetAyahPosition('last');
      setSelectedSurahNumber(prev => prev - 1);
    }
  }, [currentSurahData, currentAyahIndex, selectedSurahNumber, playAyahAudio]);

  const handleNextAyah = useCallback(() => {
    if (!currentSurahData) return;

    if (currentAyahIndex < currentSurahData.ayahs.length - 1) {
      const nextIdx = currentAyahIndex + 1;
      setCurrentAyahIndex(nextIdx);
      currentAyahIndexRef.current = nextIdx;
      if (isAutoPlayRef.current) {
        playAyahAudio(currentSurahData.ayahs[nextIdx], 'arabic');
      }
    } else if (selectedSurahNumber < 114) {
      setTargetAyahPosition('first');
      setSelectedSurahNumber(prev => prev + 1);
    }
  }, [currentSurahData, currentAyahIndex, selectedSurahNumber, playAyahAudio]);

  // Audio time formatting helper
  const formatAudioTime = (sec) => {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // User interactive seekbar click / scrub
  const handleSeekAudio = (e) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * audioDuration;
    audioRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  };

  // Audio Playback & Auto-Advance Toggle Handlers
  const handleToggleAutoPlay = useCallback(() => {
    if (isAutoPlayActive) {
      setIsAutoPlayActive(false);
      isAutoPlayRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
      setAudioPhase(null);
    } else {
      setIsAutoPlayActive(true);
      isAutoPlayRef.current = true;
      if (currentAyah) {
        playAyahAudio(currentAyah, 'arabic');
      }
    }
  }, [isAutoPlayActive, currentAyah, playAyahAudio]);

  const handleToggleAudio = useCallback(() => {
    if (!currentAyah) return;

    if (isAudioPlaying || isAudioLoading) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
      setAudioPhase(null);
      setIsAutoPlayActive(false);
      isAutoPlayRef.current = false;
    } else {
      if (autoAdvanceAudio) {
        setIsAutoPlayActive(true);
        isAutoPlayRef.current = true;
      }
      playAyahAudio(currentAyah, 'arabic');
    }
  }, [currentAyah, isAudioPlaying, isAudioLoading, autoAdvanceAudio, playAyahAudio]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      isAutoPlayRef.current = false;
      setIsAudioLoading(false);
      setAudioPhase(null);
    };
  }, []);

  // When reading full surah continuously, scroll active verse into view
  useEffect(() => {
    if (viewMode === 'surah' && isAutoPlayActive) {
      const activeEl = document.querySelector('.continuous-verse-item.active-reading-verse');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentAyahIndex, viewMode, isAutoPlayActive]);

  // Bookmarking helpers
  const handleDeleteBookmark = (e, bookmarkId) => {
    if (e) e.stopPropagation();
    const updated = bookmarks.filter(b => b.id !== bookmarkId);
    setBookmarks(updated);
    try {
      localStorage.setItem('noor_quran_bookmarks', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Return to 114 Surahs Explorer list
  const handleReturnToSurahs = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsAudioPlaying(false);
    setIsAutoPlayActive(false);
    isAutoPlayRef.current = false;
    setSelectedSurahNumber(null);
    setCurrentAyahIndex(0);
    try {
      localStorage.setItem('noor_quran_active_screen', 'explorer');
    } catch {
      // Ignored
    }
    if (isPage) {
      navigate('/quran');
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsAudioPlaying(false);
    setIsAutoPlayActive(false);
    isAutoPlayRef.current = false;
    if (isPage) {
      navigate('/zikr');
    } else if (onClose) {
      onClose();
    }
  };

  // Ayah Hasanaat reward calculation (letters * 10)
  const currentAyahReward = useMemo(() => {
    if (!currentAyah?.arabic || !currentSurahData) return 440;
    const cleanAyah = getCleanArabicText(currentAyah.arabic, currentSurahData.number, currentAyah.numberInSurah);
    const cleanLetters = cleanAyah.replace(/[\s\u064B-\u065F\u0670\u06D6-\u06ED۝0-9]/g, '').length;
    return Math.max(70, cleanLetters * 10);
  }, [currentAyah, currentSurahData]);

  // "Mark Read & Next" handler: awards points, triggers confetti, saves progress & advances
  const handleDoneAyah = () => {
    if (!currentAyah || !currentSurahData) return;

    try {
      const currentHasanaat = parseInt(localStorage.getItem('noor_quranly_hasanaat') || '2800', 10);
      localStorage.setItem('noor_quranly_hasanaat', (currentHasanaat + currentAyahReward).toString());
    } catch {
      // Ignored
    }

    setTodayVersesCount(prev => {
      const next = prev + 1;
      try { localStorage.setItem('noor_quranly_today_verses', next.toString()); } catch {}
      return next;
    });

    soundFx.playCelebration();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#06b6d4', '#38bdf8', '#f59e0b', '#a7f3d0']
      });
    } catch {
      // Ignored
    }

    saveAyahProgress(currentAyahIndex);

    if (currentAyahIndex < currentSurahData.ayahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else if (selectedSurahNumber < 114) {
      setSelectedSurahNumber(prev => prev + 1);
      setCurrentAyahIndex(0);
    }
  };



  // Direct Jump Submit
  const handleJumpSubmit = (e) => {
    e.preventDefault();
    if (!currentSurahData) return;
    const num = parseInt(jumpAyahInput, 10);
    if (!isNaN(num) && num >= 1 && num <= currentSurahData.numberOfAyahs) {
      setCurrentAyahIndex(num - 1);
      setIsJumpOpen(false);
      setJumpAyahInput('');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !selectedSurahNumber) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextAyah();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevAyah();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleToggleAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedSurahNumber, handleNextAyah, handlePrevAyah, handleToggleAudio]);

  // Surahs filter logic
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

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const q = searchQuery.toLowerCase().trim();
    return bookmarks.filter(b =>
      b.surahEnglishName.toLowerCase().includes(q) ||
      b.surahNumber.toString() === q ||
      (b.translationSnippet && b.translationSnippet.toLowerCase().includes(q))
    );
  }, [bookmarks, searchQuery]);

  // Copy Ayah text helper
  const handleCopyAyah = (ayah, e) => {
    if (e) e.stopPropagation();
    if (!ayah || !currentSurahData) return;

    const cleanArabic = getCleanArabicText(ayah.arabic, currentSurahData.number, ayah.numberInSurah);
    const textToCopy = `${cleanArabic}\n\n${ayah.transliteration}\n\n"${ayah.translation}"\n\n— Surah ${currentSurahData.englishName} (${currentSurahData.name}) ${currentSurahData.number}:${ayah.numberInSurah} • Juz ${ayah.juz}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    });
  };

  // Turn Ayah into a Dhikr counter
  const handleMakeDhikr = (ayah, e) => {
    if (e) e.stopPropagation();
    if (onAddDhikrFromAyah && currentSurahData && ayah) {
      const cleanArabic = getCleanArabicText(ayah.arabic, currentSurahData.number, ayah.numberInSurah);
      onAddDhikrFromAyah({
        title: `${currentSurahData.englishName} : ${ayah.numberInSurah}`,
        arabic: cleanArabic,
        meaning: ayah.translation,
        category: 'Quranic Ayah',
        target: 33
      });
    }
  };


  if (!isOpen && !isPage) return null;

  return (
    <div className={isPage ? "quran-view-container" : "modal-backdrop"} onClick={isPage ? undefined : handleClose}>
      <div
        className={isPage ? "quran-view-card" : "modal-content quran-modal-card"}
        onClick={e => e.stopPropagation()}
        ref={contentContainerRef}
      >
        {/* ========================================================= */}
        {/* VIEW 1: SURAH EXPLORER (SHOWN WHEN NO SURAH SELECTED)    */}
        {/* ========================================================= */}
        {!selectedSurahNumber && (
          <div className="quran-explorer-screen">
            <div className="quran-explorer-header">
              <div className="explorer-title-box">
                <div className="brand-icon-box" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  <FaBookQuran />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#ffffff' }}>The Noble Quran (القرآن الكريم)</h3>
                  <p className="explorer-subtitle">Choose a Surah to begin your immersive reading and reflection</p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={handleClose} aria-label="Close Quran Explorer">
                <HiXMark />
              </button>
            </div>

            {/* Search Input */}
            <div className="quran-search-bar">
              <HiMagnifyingGlass className="search-icon" />
              <input
                type="text"
                placeholder="Search Surah by name (e.g. Yaseen, Al-Kahf, Mulk) or number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="quran-search-input"
              />
              {searchQuery && (
                <button className="quran-clear-search" onClick={() => setSearchQuery('')} aria-label="Clear Search">
                  <HiXMark />
                </button>
              )}
            </div>

            {/* Quick Surahs Chips */}
            <div className="quick-surahs-row">
              {QUICK_SURAHS.map(item => (
                <button
                  key={item.number}
                  className="quick-surah-chip"
                  onClick={() => {
                    setSelectedSurahNumber(item.number);
                    setCurrentAyahIndex(0);
                  }}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="quran-filter-tabs">
              {['all', 'Meccan', 'Medinan', 'bookmarks'].map(tab => (
                <button
                  key={tab}
                  className={`quran-filter-btn ${filterType === tab ? 'active' : ''}`}
                  onClick={() => setFilterType(tab)}
                >
                  {tab === 'all' ? 'All Surahs (114)' : tab === 'bookmarks' ? `Bookmarks (${bookmarks.length})` : `${tab} (${tab === 'Meccan' ? 86 : 28})`}
                </button>
              ))}
            </div>

            {/* Surah List / Bookmarks */}
            {filterType === 'bookmarks' ? (
              <div className="bookmarks-list">
                {filteredBookmarks.length === 0 ? (
                  <div className="empty-bookmarks-box">
                    <HiBookmark style={{ fontSize: '2.5rem', color: 'rgba(255, 255, 255, 0.2)' }} />
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0' }}>No bookmarked verses yet.</p>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Click the bookmark ribbon on any Ayah while reading to save it here.</span>
                  </div>
                ) : (
                  filteredBookmarks.map(bm => (
                    <div
                      key={bm.id}
                      className="bookmark-card"
                      onClick={() => {
                        setSelectedSurahNumber(bm.surahNumber);
                        setCurrentAyahIndex(bm.ayahIndex || 0);
                      }}
                    >
                      <div className="bookmark-info">
                        <div className="bookmark-top-row">
                          <span className="bookmark-surah-name">Surah {bm.surahEnglishName} ({bm.surahArabicName})</span>
                          <span className="bookmark-meta-badge">Ayah {bm.ayahNumberInSurah} • Juz {bm.juz}</span>
                        </div>
                        {bm.transliterationSnippet && (
                          <p className="bookmark-translit">{bm.transliterationSnippet}</p>
                        )}
                        {bm.translationSnippet && (
                          <p className="bookmark-translation">"{bm.translationSnippet}"</p>
                        )}
                      </div>
                      <button
                        className="bookmark-del-btn"
                        onClick={e => handleDeleteBookmark(e, bm.id)}
                        title="Delete bookmark"
                        aria-label="Delete bookmark"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="quran-surahs-grid">
                {filteredSurahs.map(s => {
                  const isCurrent = lastRead?.surahNumber === s.number;
                  return (
                    <div
                      key={s.number}
                      className={`quran-surah-tile ${isCurrent ? 'last-read-tile' : ''}`}
                      onClick={() => {
                        setSelectedSurahNumber(s.number);
                        setCurrentAyahIndex(0);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="surah-tile-num">
                        <span>{s.number}</span>
                      </div>
                      <div className="surah-tile-details">
                        <div className="surah-tile-en-row">
                          <span className="surah-tile-en">{s.englishName}</span>
                          <span className="surah-revelation-tag">{s.revelationType}</span>
                        </div>
                        <span className="surah-tile-meaning">{s.englishNameTranslation} • {s.numberOfAyahs} Verses</span>
                      </div>
                      <div className="surah-tile-ar">
                        <span>{s.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !currentSurahData && (
          <div className="quran-loading-container">
            <div className="quran-loading-spinner" />
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8' }}>Loading Holy Quran text & recitation...</p>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: NOORTASBIH THEMED QURAN READER                     */}
        {/* ========================================================= */}
        {selectedSurahNumber && currentSurahData && currentAyah && (
          <div className="quran-reading-screen">
            {/* Top Navigation & Tool Bar */}
            <header className="quran-top-bar">
              <div className="top-bar-left">
                <button
                  className="quran-nav-back-btn"
                  onClick={handleReturnToSurahs}
                  title="Browse all 114 Surahs"
                  aria-label="Back to Surahs"
                >
                  <HiArrowLeft />
                  <span className="back-btn-text">Surahs</span>
                </button>

                {/* Direct Surah Switcher Dropdown */}
                <div className="surah-quick-picker-wrapper">
                  <select
                    className="surah-quick-select"
                    value={selectedSurahNumber}
                    onChange={e => {
                      const num = Number(e.target.value);
                      setSelectedSurahNumber(num);
                      setCurrentAyahIndex(0);
                    }}
                    aria-label="Switch Surah"
                    title="Switch Surah"
                  >
                    {surahsIndex.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.englishName} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="top-bar-right">
                {/* Continuous Reading vs Single Ayah Toggle */}
                <button
                  className={`quran-tool-btn ${viewMode === 'surah' ? 'active-mode' : ''}`}
                  onClick={() => setViewMode(prev => prev === 'ayah' ? 'surah' : 'ayah')}
                  title={viewMode === 'ayah' ? "Switch to Continuous Surah Reading View" : "Switch to Single Ayah Focus View"}
                  aria-label="Toggle Continuous View"
                >
                  <HiOutlineDocumentText />
                  <span className="tool-btn-label">{viewMode === 'surah' ? 'Full Surah' : 'Focus'}</span>
                </button>

                {/* Settings Button */}
                <button
                  className="quran-tool-btn"
                  onClick={() => setIsSettingsOpen(true)}
                  title="Reading Preferences & Audio Settings"
                  aria-label="Reader Settings"
                >
                  <HiCog6Tooth />
                </button>

                {/* Close to Home button */}
                <button
                  className="quran-tool-btn close-btn"
                  onClick={handleClose}
                  title="Close and return to Tasbeeh"
                  aria-label="Close Quran"
                >
                  <HiXMark />
                </button>
              </div>
            </header>

            {/* VIEW MODE A: SINGLE AYAH FOCUS CARD */}
            {viewMode === 'ayah' && (
              <div className="quran-focus-reading-card">
                {/* Card Top Metadata & Action Strip */}
                <div className="ayah-card-header">
                  <div className="ayah-info-left">
                    <span className="ayah-revelation-kicker">
                      {currentSurahData.revelationType.toUpperCase()} • JUZ {currentAyah.juz || 1} • PAGE {currentAyah.page || 1}
                    </span>
                    <div className="ayah-heading-group">
                      <h2 className="surah-title-display">
                        {currentSurahData.number}. {currentSurahData.englishName}
                      </h2>
                      <span className="ayah-position-badge">
                        Ayah {currentAyah.numberInSurah} of {currentSurahData.numberOfAyahs}
                      </span>
                    </div>
                  </div>

                  {/* Header Utility Controls */}
                  <div className="ayah-header-actions">
                    {/* Continuous Auto-Play Recitation Toggle */}
                    <button
                      className={`ayah-autoplay-pill-btn ${isAutoPlayActive ? 'autoplay-active' : ''} ${isAudioLoading ? 'autoplay-loading' : ''}`}
                      onClick={handleToggleAutoPlay}
                      title={isAutoPlayActive ? "Pause Continuous Auto Play" : "Continuous Auto Play Recitation"}
                      aria-label="Toggle Continuous Auto Play"
                    >
                      {isAudioLoading ? (
                        <span className="audio-spinner-ring mini" />
                      ) : isAutoPlayActive ? (
                        <HiPause />
                      ) : (
                        <HiPlay />
                      )}
                      <span>
                        {isAudioLoading
                          ? `Downloading ${downloadProgress > 0 ? downloadProgress + '%' : '...'}`
                          : isAutoPlayActive
                          ? 'Playing'
                          : 'Auto Play'}
                      </span>
                      {isAutoPlayActive && !isAudioLoading && (
                        <span className="sound-wave-bars">
                          <span className="bar b1"></span>
                          <span className="bar b2"></span>
                          <span className="bar b3"></span>
                        </span>
                      )}
                    </button>

                    {/* Quick Urdu Audio Recitation Toggle Pill */}
                    <button
                      className={`ayah-urdu-toggle-btn ${playUrduAudio ? 'active' : ''}`}
                      onClick={() => setPlayUrduAudio(prev => !prev)}
                      title={playUrduAudio ? "Urdu translation audio enabled (click to mute)" : "Urdu translation audio disabled (click to enable)"}
                      aria-label="Toggle Urdu Audio Recitation"
                    >
                      <span className="urdu-pill-indicator" />
                      <span>اردو {playUrduAudio ? 'Audio ON' : 'Audio OFF'}</span>
                    </button>

                    {/* Audio Recitation Button */}
                    <button
                      className={`ayah-action-circle-btn ${isAudioPlaying ? 'audio-active' : ''} ${isAudioLoading ? 'audio-loading' : ''}`}
                      onClick={handleToggleAudio}
                      title={isAudioLoading ? "Downloading recitation audio..." : isAudioPlaying ? "Pause Recitation" : "Listen to Recitation (Arabic & Urdu)"}
                      aria-label="Play Recitation Audio"
                    >
                      {isAudioLoading ? (
                        <span className="audio-spinner-ring mini" />
                      ) : isAudioPlaying ? (
                        <HiSpeakerWave />
                      ) : (
                        <HiSpeakerXMark />
                      )}
                    </button>

                    {/* Direct Jump Toggle */}
                    <button
                      className="ayah-action-circle-btn"
                      onClick={() => setIsJumpOpen(prev => !prev)}
                      title="Jump directly to Ayah number"
                      aria-label="Jump to Verse"
                    >
                      <span className="jump-indicator-num">#</span>
                    </button>
                  </div>
                </div>

                {/* Audio Recitation & API Download Progress Track */}
                {(isAudioPlaying || isAudioLoading || downloadProgress > 0) && (
                  <div className="ayah-audio-progress-container">
                    <div className="audio-progress-meta-row">
                      <div className="audio-meta-left">
                        {isAudioLoading ? (
                          <span className="audio-status-tag loading">
                            <span className="audio-spinner-ring" />
                            <span>
                              {audioPhase === 'urdu'
                                ? `Downloading Urdu Translation... ${downloadProgress > 0 ? `${downloadProgress}%` : ''}`
                                : `Downloading Arabic Recitation... ${downloadProgress > 0 ? `${downloadProgress}%` : ''}`}
                            </span>
                          </span>
                        ) : audioPhase === 'urdu' ? (
                          <span className="audio-status-tag urdu-playing">
                            <span className="sound-wave-bars urdu-bars">
                              <span className="bar b1" />
                              <span className="bar b2" />
                              <span className="bar b3" />
                            </span>
                            <span>Urdu: Shamshad Ali Khan • Verse {currentAyah.numberInSurah} (اردو ترجمہ)</span>
                          </span>
                        ) : (
                          <span className="audio-status-tag playing">
                            <span className="sound-wave-bars">
                              <span className="bar b1" />
                              <span className="bar b2" />
                              <span className="bar b3" />
                            </span>
                            <span>Arabic: Mishary Rashid Alafasy • Verse {currentAyah.numberInSurah}</span>
                          </span>
                        )}
                      </div>

                      <div className="audio-meta-right">
                        <span className={`audio-phase-badge ${audioPhase || 'arabic'}`}>
                          {audioPhase === 'urdu' ? 'اردو ترجمہ' : 'Arabic Recitation'}
                        </span>
                        {isAudioLoading && downloadProgress > 0 && (
                          <span className="audio-buffer-label">
                            {downloadProgress}% Cached
                          </span>
                        )}
                        <span className="audio-time-label">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                    </div>

                    {/* Dual Track: Buffer/Download + Playback Progress */}
                    <div
                      className="audio-progress-track-wrapper"
                      onClick={handleSeekAudio}
                      title="Click or drag to seek in recitation"
                      role="progressbar"
                      aria-valuenow={audioDuration ? Math.round((audioCurrentTime / audioDuration) * 100) : 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div className="audio-track-bg">
                        {/* API Download / Buffer fill */}
                        <div
                          className={`audio-buffer-fill ${isAudioLoading && downloadProgress < 30 ? 'buffer-indeterminate' : ''}`}
                          style={{ width: `${Math.max(downloadProgress, isAudioLoading ? 25 : 0)}%` }}
                        />
                        {/* Playback progress fill */}
                        <div
                          className="audio-playback-fill"
                          style={{
                            width: `${audioDuration > 0 ? Math.min(100, (audioCurrentTime / audioDuration) * 100) : 0}%`
                          }}
                        >
                          <span className="audio-scrub-handle" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Jump Popover Form */}
                {isJumpOpen && (
                  <form className="quran-jump-panel" onSubmit={handleJumpSubmit}>
                    <span className="jump-panel-label">Jump to Verse (1 - {currentSurahData.numberOfAyahs}):</span>
                    <div className="jump-input-row">
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
                      <button type="submit" className="jump-submit-btn">Go</button>
                      <button type="button" className="jump-close-btn" onClick={() => setIsJumpOpen(false)}>
                        <HiXMark />
                      </button>
                    </div>
                  </form>
                )}

                {/* Surah Arabic Name Ribbon */}
                <div className="surah-arabic-ribbon">
                  <span className="surah-arabic-name">{currentSurahData.name}</span>
                  {selectedSurahNumber !== 9 && selectedSurahNumber !== 1 && currentAyah.numberInSurah === 1 && (
                    <div className="surah-bismillah-box">
                      <p className="surah-bismillah-script" dir="rtl" lang="ar">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </p>
                    </div>
                  )}
                </div>

                {/* 1. AUTHENTIC ARABIC CALLIGRAPHY */}
                <div className="ayah-arabic-section" style={{ fontSize: `${arabicFontSize}px` }}>
                  <p className="ayah-arabic-script" dir="rtl" lang="ar">
                    {getCleanArabicText(currentAyah.arabic, currentSurahData.number, currentAyah.numberInSurah)}
                    <span className="ayah-end-medallion"> ۝{currentAyah.numberInSurah} </span>
                  </p>
                </div>

                {/* 2. TRANSLITERATION — MANDATORY: DISPLAYED DIRECTLY BELOW ARABIC SCRIPT */}
                {showTransliteration && currentAyah.transliteration && (
                  <div className="ayah-transliteration-container">
                    <span className="script-kicker translit-kicker">Transliteration</span>
                    <p className="ayah-transliteration-text">
                      {currentAyah.transliteration}
                    </p>
                  </div>
                )}

                {/* 3. ENGLISH TRANSLATION */}
                {showTranslation && currentAyah.translation && (
                  <div className="ayah-translation-container">
                    <span className="script-kicker trans-kicker">English Translation</span>
                    <p className="ayah-translation-text">
                      "{currentAyah.translation}"
                    </p>
                  </div>
                )}

                {/* 4. URDU TRANSLATION (AUTHENTIC JALANDHRY) */}
                {showUrduTranslation && currentAyah.urduTranslation && (
                  <div className="ayah-translation-container urdu-translation-container">
                    <span className="script-kicker urdu-kicker">اردو ترجمہ (فتح محمد جالندہری)</span>
                    <p className="ayah-urdu-text" dir="rtl" lang="ur">
                      {currentAyah.urduTranslation}
                    </p>
                  </div>
                )}

                {/* Quick Verse Actions: Copy & Dhikr Maker */}
                <div className="ayah-quick-tools-row">
                  <button
                    className="ayah-tool-pill"
                    onClick={e => handleCopyAyah(currentAyah, e)}
                    title="Copy Arabic, transliteration and translation to clipboard"
                  >
                    <HiClipboardDocument />
                    <span>{copiedFeedback ? 'Copied to Clipboard!' : 'Copy Verse'}</span>
                  </button>

                  {onAddDhikrFromAyah && (
                    <button
                      className="ayah-tool-pill dhikr-pill"
                      onClick={e => handleMakeDhikr(currentAyah, e)}
                      title="Create a Tasbeeh counter from this Ayah"
                    >
                      <HiPlusCircle />
                      <span>Count as Tasbeeh</span>
                    </button>
                  )}
                </div>

                {/* Ayah Range Scrub Slider */}
                <div className="ayah-scrubber-bar">
                  <span className="scrub-label">Ayah {currentAyah.numberInSurah}</span>
                  <input
                    type="range"
                    min="0"
                    max={currentSurahData.numberOfAyahs - 1}
                    value={currentAyahIndex}
                    onChange={e => setCurrentAyahIndex(Number(e.target.value))}
                    className="ayah-scrub-range"
                    aria-label="Scrub through verses"
                  />
                  <span className="scrub-total">{currentSurahData.numberOfAyahs}</span>
                </div>

                {/* Bottom Navigation Row: Previous, Mark Read & Next (+Hasanaat), Next */}
                <footer className="ayah-bottom-nav-footer">
                  <button
                    className="nav-step-btn prev"
                    onClick={handlePrevAyah}
                    disabled={selectedSurahNumber === 1 && currentAyahIndex === 0}
                    aria-label="Previous Ayah"
                    title="Previous Ayah (Left Arrow)"
                  >
                    <HiArrowLeft />
                    <span>Prev</span>
                  </button>

                  <button
                    className="nav-mark-done-btn"
                    onClick={handleDoneAyah}
                    title="Complete verse recitation, earn +Hasanaat and advance"
                  >
                    <span className="btn-main-text">Mark Read & Next</span>
                    <span className="btn-reward-badge">+{currentAyahReward} Hasanaat</span>
                  </button>

                  <button
                    className="nav-step-btn next"
                    onClick={handleNextAyah}
                    disabled={selectedSurahNumber === 114 && currentAyahIndex === currentSurahData.ayahs.length - 1}
                    aria-label="Next Ayah"
                    title="Next Ayah (Right Arrow)"
                  >
                    <span>Next</span>
                    <HiArrowRight />
                  </button>
                </footer>
              </div>
            )}

            {/* VIEW MODE B: CONTINUOUS FULL SURAH READING VIEW */}
            {viewMode === 'surah' && (
              <div className="quran-continuous-surah-view">
                <div className="continuous-view-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {currentSurahData.number}. {currentSurahData.englishName} ({currentSurahData.name})
                      </h2>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {currentSurahData.revelationType.toUpperCase()} • {currentSurahData.numberOfAyahs} Verses
                      </span>
                    </div>

                    <button
                      className={`ayah-autoplay-pill-btn ${isAutoPlayActive ? 'autoplay-active' : ''} ${isAudioLoading ? 'autoplay-loading' : ''}`}
                      onClick={handleToggleAutoPlay}
                      title={isAutoPlayActive ? "Pause Continuous Auto Play" : "Continuous Auto Play Recitation"}
                      aria-label="Toggle Continuous Auto Play"
                    >
                      {isAudioLoading ? (
                        <span className="audio-spinner-ring mini" />
                      ) : isAutoPlayActive ? (
                        <HiPause />
                      ) : (
                        <HiPlay />
                      )}
                      <span>
                        {isAudioLoading
                          ? `Downloading ${downloadProgress > 0 ? downloadProgress + '%' : '...'}`
                          : isAutoPlayActive
                          ? 'Playing Continuous'
                          : 'Auto Play Surah'}
                      </span>
                      {isAutoPlayActive && !isAudioLoading && (
                        <span className="sound-wave-bars">
                          <span className="bar b1"></span>
                          <span className="bar b2"></span>
                          <span className="bar b3"></span>
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Continuous Recitation & API Download Progress Track */}
                  {(isAudioPlaying || isAudioLoading || downloadProgress > 0) && (
                    <div className="ayah-audio-progress-container" style={{ margin: '0.65rem 0 1rem 0' }}>
                      <div className="audio-progress-meta-row">
                        <div className="audio-meta-left">
                          {isAudioLoading ? (
                            <span className="audio-status-tag loading">
                              <span className="audio-spinner-ring" />
                              <span>
                                {audioPhase === 'urdu'
                                  ? `Downloading Urdu Translation audio... ${downloadProgress > 0 ? `${downloadProgress}%` : ''}`
                                  : `Downloading Arabic Recitation audio... ${downloadProgress > 0 ? `${downloadProgress}%` : ''}`}
                              </span>
                            </span>
                          ) : (
                            <span className={`audio-status-tag playing ${audioPhase === 'urdu' ? 'urdu-playing' : ''}`}>
                              <span className={`sound-wave-bars ${audioPhase === 'urdu' ? 'urdu-bars' : ''}`}>
                                <span className="bar b1" />
                                <span className="bar b2" />
                                <span className="bar b3" />
                              </span>
                              <span>
                                {audioPhase === 'urdu'
                                  ? `Shamshad Ali Khan (اردو ترجمہ) • Verse ${currentSurahData.ayahs[currentAyahIndex]?.numberInSurah}`
                                  : `Mishary Rashid Alafasy (عربی تلاوت) • Verse ${currentSurahData.ayahs[currentAyahIndex]?.numberInSurah}`}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="audio-meta-right">
                          {isAudioLoading && downloadProgress > 0 && (
                            <span className="audio-buffer-label">
                              {downloadProgress}% Downloaded
                            </span>
                          )}
                          <span className="audio-time-label">
                            {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                          </span>
                        </div>
                      </div>

                      <div
                        className="audio-progress-track-wrapper"
                        onClick={handleSeekAudio}
                        title="Click or drag to seek in recitation"
                        role="progressbar"
                        aria-valuenow={audioDuration ? Math.round((audioCurrentTime / audioDuration) * 100) : 0}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <div className="audio-track-bg">
                          <div
                            className={`audio-buffer-fill ${isAudioLoading && downloadProgress < 30 ? 'buffer-indeterminate' : ''}`}
                            style={{ width: `${Math.max(downloadProgress, isAudioLoading ? 25 : 0)}%` }}
                          />
                          <div
                            className="audio-playback-fill"
                            style={{
                              width: `${audioDuration > 0 ? Math.min(100, (audioCurrentTime / audioDuration) * 100) : 0}%`
                            }}
                          >
                            <span className="audio-scrub-handle" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="surah-bismillah-box" dir="rtl">
                    {selectedSurahNumber !== 9 && (
                      <p className="bismillah-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                    )}
                  </div>
                </div>

                <div className="continuous-verses-list">
                  {currentSurahData.ayahs.map((ay, idx) => (
                    <div
                      key={ay.number}
                      className={`continuous-verse-item ${idx === currentAyahIndex ? 'active-reading-verse' : ''}`}
                      onClick={() => setCurrentAyahIndex(idx)}
                    >
                      <div className="verse-item-top">
                        <span className="verse-item-badge">Verse {ay.numberInSurah}</span>
                        <div className="verse-item-actions">
                          <button
                            className="verse-mini-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentAyahIndex(idx);
                              currentAyahIndexRef.current = idx;
                              setIsAutoPlayActive(true);
                              isAutoPlayRef.current = true;
                              playAyahAudio(ay, 'arabic');
                            }}
                            title="Start continuous recitation from this verse"
                          >
                            {idx === currentAyahIndex && isAudioPlaying ? (
                              <HiSpeakerWave style={{ color: '#10b981' }} />
                            ) : (
                              <HiSpeakerWave />
                            )}
                          </button>
                          <button
                            className="verse-mini-btn"
                            onClick={(e) => handleCopyAyah(ay, e)}
                            title="Copy verse"
                          >
                            <HiClipboardDocument />
                          </button>
                        </div>
                      </div>

                      {/* 1. Arabic Text */}
                      <p className="continuous-arabic-text" dir="rtl" lang="ar" style={{ fontSize: `${arabicFontSize}px` }}>
                        {getCleanArabicText(ay.arabic, currentSurahData.number, ay.numberInSurah)}
                        <span className="ayah-end-medallion"> ۝{ay.numberInSurah} </span>
                      </p>

                      {/* 2. Transliteration — Below Arabic */}
                      {showTransliteration && ay.transliteration && (
                        <p className="continuous-transliteration-text">
                          {ay.transliteration}
                        </p>
                      )}

                      {/* 3. English Translation */}
                      {showTranslation && ay.translation && (
                        <p className="continuous-translation-text">
                          "{ay.translation}"
                        </p>
                      )}

                      {/* 4. Urdu Translation */}
                      {showUrduTranslation && ay.urduTranslation && (
                        <p className="continuous-urdu-text" dir="rtl" lang="ur">
                          {ay.urduTranslation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SETTINGS MODAL ⚙️                                        */}
        {/* ========================================================= */}
        {isSettingsOpen && (
          <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-content quran-settings-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                    <HiCog6Tooth />
                  </div>
                  <div>
                    <h3 className="modal-title">Quran Reader Settings</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Customize typography, audio, and goals</p>
                  </div>
                </div>
                <button className="close-modal-btn" onClick={() => setIsSettingsOpen(false)} aria-label="Close Settings">
                  <HiXMark />
                </button>
              </div>

              <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {/* Daily Verse Goal */}
                <div className="settings-item">
                  <label className="form-label">Daily Verse Goal</label>
                  <div className="goal-options-grid">
                    {[1, 3, 5, 10, 20].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        className={`goal-btn ${dailyGoal === cnt ? 'active' : ''}`}
                        onClick={() => {
                          setDailyGoal(cnt);
                          try { localStorage.setItem('noor_quranly_daily_goal', cnt.toString()); } catch {}
                        }}
                      >
                        +{cnt} Verses
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arabic Font Size */}
                <div className="settings-item">
                  <label className="form-label">Arabic Font Size: {arabicFontSize}px</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="font-btn"
                      onClick={() => setArabicFontSize(prev => Math.max(22, prev - 2))}
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="22"
                      max="48"
                      value={arabicFontSize}
                      onChange={e => setArabicFontSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#10b981' }}
                    />
                    <button
                      type="button"
                      className="font-btn"
                      onClick={() => setArabicFontSize(prev => Math.min(48, prev + 2))}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Display Toggles */}
                <div className="settings-item">
                  <label className="setting-toggle-row">
                    <span>Show English Translation</span>
                    <input
                      type="checkbox"
                      checked={showTranslation}
                      onChange={e => setShowTranslation(e.target.checked)}
                      className="setting-checkbox"
                    />
                  </label>
                  <label className="setting-toggle-row">
                    <span>Show Urdu Translation (اردو ترجمہ)</span>
                    <input
                      type="checkbox"
                      checked={showUrduTranslation}
                      onChange={e => {
                        setShowUrduTranslation(e.target.checked);
                        try { localStorage.setItem('noor_show_urdu_translation', JSON.stringify(e.target.checked)); } catch {}
                      }}
                      className="setting-checkbox"
                    />
                  </label>
                  <label className="setting-toggle-row">
                    <span>Show Phonetic Transliteration</span>
                    <input
                      type="checkbox"
                      checked={showTransliteration}
                      onChange={e => setShowTransliteration(e.target.checked)}
                      className="setting-checkbox"
                    />
                  </label>
                  <label className="setting-toggle-row">
                    <span>Play Urdu Audio after Arabic (اردو آڈیو ترجمہ)</span>
                    <input
                      type="checkbox"
                      checked={playUrduAudio}
                      onChange={e => {
                        setPlayUrduAudio(e.target.checked);
                        try { localStorage.setItem('noor_play_urdu_audio', JSON.stringify(e.target.checked)); } catch {}
                      }}
                      className="setting-checkbox"
                    />
                  </label>
                  <label className="setting-toggle-row">
                    <span>Auto-advance Recitation Audio</span>
                    <input
                      type="checkbox"
                      checked={autoAdvanceAudio}
                      onChange={e => setAutoAdvanceAudio(e.target.checked)}
                      className="setting-checkbox"
                    />
                  </label>
                </div>

                {/* Switch Surah Dropdown */}
                <div className="settings-item">
                  <label className="form-label">Jump to Another Surah</label>
                  <select
                    className="surah-select-dropdown"
                    value={selectedSurahNumber || 1}
                    onChange={e => {
                      setSelectedSurahNumber(Number(e.target.value));
                      setCurrentAyahIndex(0);
                      setIsSettingsOpen(false);
                    }}
                  >
                    {surahsIndex.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.englishName} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="modal-btn-confirm" onClick={() => setIsSettingsOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
