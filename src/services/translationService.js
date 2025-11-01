// Translation Service using MyMemory Translation API (Free, no auth required)
// Supports 100+ languages

const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';
const CACHE_KEY_PREFIX = 'translation_cache_';
const CACHE_EXPIRY_DAYS = 7;

// Common language codes
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', native: 'Filipino' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'no', name: 'Norwegian', native: 'Norsk' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'cs', name: 'Czech', native: 'Čeština' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', native: 'עברית' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar' },
];

// Base translations (English) - fallback if API fails
const BASE_TRANSLATIONS = {
  // Navigation
  smartDustbins: 'Smart Dustbins',
  binFinder: 'Bin Finder',
  kabadConnect: 'KabadConnect',
  
  // Common
  welcome: 'Welcome',
  welcomeBack: 'Welcome back',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  continue: 'Continue',
  submit: 'Submit',
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  
  // Dashboard
  myRewards: 'My Rewards',
  points: 'Points',
  scanHistory: 'Scan History',
  enterCode: 'Enter Dustbin Code',
  howItWorks: 'How It Works',
  
  // Onboarding
  getStarted: 'Get Started',
  selectLanguage: 'Select Your Language',
  tagline: 'Recycle Smart, Earn Rewards',
  
  // Leaderboard
  cityLeaderboard: 'City Sustainability Leaderboard',
  citiesLeading: 'Cities Making a Difference',
  citiesLeadingSub: 'See which cities are leading the sustainability revolution',
  viewLeaderboard: 'View Full Leaderboard',
  
  // KabadConnect
  schedulePickup: 'Schedule Pickup',
  newPickup: 'New Pickup',
  pastDeliveries: 'Past Deliveries',
  ecoMissions: 'Eco Missions',
  
  // Profile
  profile: 'Profile',
  achievements: 'Achievements',
  logout: 'Logout',
};

// Cache management
const getCacheKey = (text, sourceLang, targetLang) => {
  return `${CACHE_KEY_PREFIX}${sourceLang}_${targetLang}_${text.toLowerCase().replace(/\s+/g, '_')}`;
};

const getCachedTranslation = (text, sourceLang, targetLang) => {
  try {
    const cacheKey = getCacheKey(text, sourceLang, targetLang);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { translation, timestamp } = JSON.parse(cached);
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (Date.now() - timestamp > expiryTime) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return translation;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setCachedTranslation = (text, sourceLang, targetLang, translation) => {
  try {
    const cacheKey = getCacheKey(text, sourceLang, targetLang);
    const cacheData = {
      translation,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Cache write error:', error);
    // If localStorage is full, clear old translations
    if (error.name === 'QuotaExceededError') {
      clearOldTranslationCache();
    }
  }
};

const clearOldTranslationCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const translationKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    // Sort by timestamp and remove oldest 50%
    const sortedKeys = translationKeys
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return { key, timestamp: data.timestamp || 0 };
        } catch {
          return { key, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const keysToRemove = sortedKeys.slice(0, Math.floor(sortedKeys.length / 2));
    keysToRemove.forEach(({ key }) => localStorage.removeItem(key));
    
    console.log(`Cleared ${keysToRemove.length} old translation cache entries`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Translate text using MyMemory API
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  // If source and target are the same, return original text
  if (sourceLang === targetLang) {
    return text;
  }
  
  // Check cache first
  const cached = getCachedTranslation(text, sourceLang, targetLang);
  if (cached) {
    return cached;
  }
  
  try {
    // Construct API URL
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });
    
    const response = await fetch(`${TRANSLATION_API_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(`Translation failed: ${data.responseDetails}`);
    }
    
    const translation = data.responseData.translatedText;
    
    // Cache the translation
    setCachedTranslation(text, sourceLang, targetLang, translation);
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to original text
    return text;
  }
};

// Batch translate multiple texts
export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
  if (sourceLang === targetLang) {
    return texts;
  }
  
  try {
    // Try to get from cache first
    const translations = await Promise.all(
      texts.map(async (text) => {
        const cached = getCachedTranslation(text, sourceLang, targetLang);
        if (cached) return cached;
        
        // If not in cache, translate
        return await translateText(text, targetLang, sourceLang);
      })
    );
    
    return translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Fallback to original texts
  }
};

// Get translation for a key from base translations
export const getBaseTranslation = (key) => {
  return BASE_TRANSLATIONS[key] || key;
};

// Preload translations for common keys
export const preloadTranslations = async (targetLang) => {
  if (targetLang === 'en') return;
  
  const commonKeys = Object.keys(BASE_TRANSLATIONS);
  const commonTexts = Object.values(BASE_TRANSLATIONS);
  
  // Check which translations are not cached
  const textsToTranslate = commonTexts.filter(
    text => !getCachedTranslation(text, 'en', targetLang)
  );
  
  if (textsToTranslate.length === 0) {
    console.log('All common translations already cached');
    return;
  }
  
  console.log(`Preloading ${textsToTranslate.length} translations for ${targetLang}...`);
  
  // Translate in batches of 5 to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < textsToTranslate.length; i += batchSize) {
    const batch = textsToTranslate.slice(i, i + batchSize);
    await Promise.all(
      batch.map(text => translateText(text, targetLang, 'en'))
    );
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < textsToTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('Preloading complete');
};

// Clear all translation cache
export const clearTranslationCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const translationKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    translationKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${translationKeys.length} translation cache entries`);
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
};

