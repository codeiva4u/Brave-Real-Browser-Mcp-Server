/**
 * Internationalization Utility
 */
const en = require('../languages/en.js');
const hi = require('../languages/hi.js');
const languagePacks = { en, hi, english: en, hindi: hi };

function getLanguagePack(langCode) {
  return languagePacks[(langCode || 'en').toLowerCase()] || languagePacks.en;
}

function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ];
}

function translate(langCode, key, fallback = '') {
  const lang = getLanguagePack(langCode);
  let value = lang;
  for (const k of key.split('.')) {
    value = value?.[k];
    if (value === undefined) break;
  }
  return value || fallback;
}

module.exports = { getLanguagePack, getAvailableLanguages, translate };
