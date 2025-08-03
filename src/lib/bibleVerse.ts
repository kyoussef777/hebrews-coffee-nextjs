// Bible verse fetching utility for inspirational customer labels

export interface BibleVerse {
  pk: number;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

// Book names mapping for display (book number to name)
const BOOK_NAMES: Record<number, string> = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
  65: 'Jude', 66: 'Revelation'
};

// Curated list of encouraging verse references for better customer experience
// These verses focus on hope, love, strength, peace, and encouragement
const ENCOURAGING_VERSES = [
  { book: 19, chapter: 23, verse: 1 }, // Psalm 23:1 - The Lord is my shepherd
  { book: 19, chapter: 46, verse: 1 }, // Psalm 46:1 - God is our refuge and strength
  { book: 19, chapter: 118, verse: 24 }, // Psalm 118:24 - This is the day the Lord has made
  { book: 20, chapter: 3, verse: 5 }, // Proverbs 3:5 - Trust in the Lord with all your heart
  { book: 23, chapter: 40, verse: 31 }, // Isaiah 40:31 - Those who wait on the Lord
  { book: 24, chapter: 29, verse: 11 }, // Jeremiah 29:11 - Plans to prosper you
  { book: 40, chapter: 5, verse: 16 }, // Matthew 5:16 - Let your light shine
  { book: 40, chapter: 11, verse: 28 }, // Matthew 11:28 - Come to me, all you who are weary
  { book: 43, chapter: 3, verse: 16 }, // John 3:16 - For God so loved the world
  { book: 43, chapter: 14, verse: 27 }, // John 14:27 - Peace I leave with you
  { book: 43, chapter: 16, verse: 33 }, // John 16:33 - In this world you will have trouble
  { book: 45, chapter: 8, verse: 28 }, // Romans 8:28 - All things work together for good
  { book: 46, chapter: 10, verse: 13 }, // 1 Corinthians 10:13 - No temptation beyond what you can bear
  { book: 47, chapter: 5, verse: 17 }, // 2 Corinthians 5:17 - New creation
  { book: 49, chapter: 2, verse: 10 }, // Ephesians 2:10 - We are His workmanship
  { book: 50, chapter: 4, verse: 6 }, // Philippians 4:6 - Be anxious for nothing
  { book: 50, chapter: 4, verse: 13 }, // Philippians 4:13 - I can do all things through Christ
  { book: 50, chapter: 4, verse: 19 }, // Philippians 4:19 - God will supply all your needs
  { book: 51, chapter: 3, verse: 17 }, // Colossians 3:17 - Whatever you do in word or deed
  { book: 55, chapter: 1, verse: 7 }, // 2 Timothy 1:7 - God has not given us a spirit of fear
  { book: 58, chapter: 13, verse: 5 }, // Hebrews 13:5 - I will never leave you nor forsake you
  { book: 59, chapter: 1, verse: 17 }, // James 1:17 - Every good and perfect gift
  { book: 60, chapter: 5, verse: 7 }, // 1 Peter 5:7 - Cast all your anxiety on Him
];

/**
 * Fetches a random encouraging Bible verse from the NKJV translation
 * Uses a curated list of encouraging verses for better customer experience
 */
export async function getRandomEncouragingVerse(): Promise<{ text: string; reference: string } | null> {
  try {
    // Use curated encouraging verses 80% of the time, random 20% of the time
    const useRandomVerse = Math.random() < 0.2;
    
    let verseData: BibleVerse;
    
    if (useRandomVerse) {
      // Fetch completely random verse
      const response = await fetch('https://bolls.life/get-random-verse/NKJV/', {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      verseData = await response.json();
    } else {
      // Pick from curated encouraging verses
      const randomVerse = ENCOURAGING_VERSES[Math.floor(Math.random() * ENCOURAGING_VERSES.length)];
      const response = await fetch(
        `https://bolls.life/get-verse/NKJV/${randomVerse.book}/${randomVerse.chapter}/${randomVerse.verse}/`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      // The API doesn't return book/chapter info, so we need to add it manually
      verseData = {
        ...apiResponse,
        book: randomVerse.book,
        chapter: randomVerse.chapter,
        verse: randomVerse.verse
      };
    }
    
    // Clean up the text (remove HTML tags if any)
    const cleanText = verseData.text.replace(/<[^>]*>/g, '');
    
    // Format the reference
    const bookName = BOOK_NAMES[verseData.book] || `Book ${verseData.book}`;
    const reference = `${bookName} ${verseData.chapter}:${verseData.verse}`;
    
    return {
      text: cleanText,
      reference: reference
    };
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    // Return a fallback verse if API fails
    return {
      text: "The Lord bless you and keep you; The Lord make His face shine upon you, And be gracious to you.",
      reference: "Numbers 6:24-25"
    };
  }
}

/**
 * Formats a verse for label display with proper line wrapping
 */
export function formatVerseForLabel(verse: { text: string; reference: string }): string {
  const verseText = verse.text;
  const reference = `- ${verse.reference}`;
  
  // Keep verse text and reference together
  return `${verseText} ${reference}`;
}

/**
 * Gets verse text that fits within specified character limits
 * If the verse is too long, it will try to get a shorter one
 */
export async function getVerseForLabel(maxLength: number = 150): Promise<{ text: string; reference: string } | null> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const verse = await getRandomEncouragingVerse();
    
    if (!verse) return null;
    
    const formattedVerse = formatVerseForLabel(verse);
    
    if (formattedVerse.length <= maxLength) {
      return verse;
    }
    
    attempts++;
  }
  
  // If we can't find a short enough verse, return a short fallback
  return {
    text: "God is our refuge and strength, A very present help in trouble.",
    reference: "Psalm 46:1"
  };
}