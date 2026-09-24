/**
 * Script to fetch the entire Quran locally from free API
 * Captures:
 * 1. Arabic text (quran-uthmani)
 * 2. English translation (en.sahih - Sahih International)
 * 3. English transliteration (en.transliteration)
 * 
 * Saves to:
 * - public/data/quran/surahs.json (Index of 114 Surahs)
 * - public/data/quran/surahs/{number}.json (Individual Surah with all Ayahs)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../public/data/quran');
const SURAHS_DIR = path.join(DATA_DIR, 'surahs');

if (!fs.existsSync(SURAHS_DIR)) {
  fs.mkdirSync(SURAHS_DIR, { recursive: true });
}

async function fetchQuran() {
  console.log('Fetching complete Arabic text, English translation, and Transliteration...');

  const [resUthmani, resTranslation, resTransliteration] = await Promise.all([
    fetch('https://api.alquran.cloud/v1/quran/quran-uthmani').then(r => r.json()),
    fetch('https://api.alquran.cloud/v1/quran/en.sahih').then(r => r.json()),
    fetch('https://api.alquran.cloud/v1/quran/en.transliteration').then(r => r.json())
  ]);

  if (resUthmani.code !== 200 || resTranslation.code !== 200 || resTransliteration.code !== 200) {
    throw new Error('Failed to fetch one or more Quran editions from api.alquran.cloud');
  }

  const uthmaniSurahs = resUthmani.data.surahs;
  const translationSurahs = resTranslation.data.surahs;
  const transliterationSurahs = resTransliteration.data.surahs;

  console.log(`Successfully downloaded ${uthmaniSurahs.length} Surahs from all 3 editions.`);

  const surahsIndex = [];

  for (let i = 0; i < uthmaniSurahs.length; i++) {
    const sU = uthmaniSurahs[i];
    const sT = translationSurahs[i];
    const sTr = transliterationSurahs[i];

    const surahInfo = {
      number: sU.number,
      name: sU.name,
      englishName: sU.englishName,
      englishNameTranslation: sU.englishNameTranslation,
      revelationType: sU.revelationType,
      numberOfAyahs: sU.ayahs.length
    };

    surahsIndex.push(surahInfo);

    // Merge Ayahs
    const mergedAyahs = sU.ayahs.map((ayah, aIdx) => {
      const transAyah = sT.ayahs[aIdx] || {};
      const translitAyah = sTr.ayahs[aIdx] || {};

      return {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        arabic: ayah.text,
        translation: transAyah.text || '',
        transliteration: translitAyah.text || '',
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda || false
      };
    });

    const fullSurah = {
      ...surahInfo,
      ayahs: mergedAyahs
    };

    const surahPath = path.join(SURAHS_DIR, `${sU.number}.json`);
    fs.writeFileSync(surahPath, JSON.stringify(fullSurah, null, 2), 'utf-8');
  }

  // Write surahs index
  const indexPath = path.join(DATA_DIR, 'surahs.json');
  fs.writeFileSync(indexPath, JSON.stringify(surahsIndex, null, 2), 'utf-8');

  console.log(`Saved index to ${indexPath}`);
  console.log(`Saved 114 individual surahs with Arabic, English Translation & Transliteration to ${SURAHS_DIR}`);
}

fetchQuran().catch(err => {
  console.error('Error downloading Quran data:', err);
  process.exit(1);
});
