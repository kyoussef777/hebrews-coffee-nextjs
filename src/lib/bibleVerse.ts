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
// These verses focus on hope, love, strength, peace, encouragement, guidance, and prayer
const ENCOURAGING_VERSES = [
  // COMFORT & PEACE
  { book: 19, chapter: 23, verse: 1 }, // Psalm 23:1 - The Lord is my shepherd
  { book: 19, chapter: 46, verse: 1 }, // Psalm 46:1 - God is our refuge and strength
  { book: 19, chapter: 46, verse: 10 }, // Psalm 46:10 - Be still and know that I am God
  { book: 19, chapter: 55, verse: 22 }, // Psalm 55:22 - Cast your burden on the Lord
  { book: 40, chapter: 11, verse: 28 }, // Matthew 11:28 - Come to me, all you who are weary
  { book: 43, chapter: 14, verse: 27 }, // John 14:27 - Peace I leave with you
  { book: 23, chapter: 26, verse: 3 }, // Isaiah 26:3 - Perfect peace
  { book: 19, chapter: 34, verse: 18 }, // Psalm 34:18 - Near to the brokenhearted
  { book: 19, chapter: 147, verse: 3 }, // Psalm 147:3 - Heals the brokenhearted
  
  // STRENGTH & COURAGE
  { book: 23, chapter: 40, verse: 31 }, // Isaiah 40:31 - Those who wait on the Lord
  { book: 50, chapter: 4, verse: 13 }, // Philippians 4:13 - I can do all things through Christ
  { book: 55, chapter: 1, verse: 7 }, // 2 Timothy 1:7 - God has not given us a spirit of fear
  { book: 6, chapter: 1, verse: 9 }, // Joshua 1:9 - Be strong and courageous
  { book: 5, chapter: 31, verse: 6 }, // Deuteronomy 31:6 - Be strong and of good courage
  { book: 19, chapter: 27, verse: 14 }, // Psalm 27:14 - Wait on the Lord; be of good courage
  { book: 23, chapter: 41, verse: 10 }, // Isaiah 41:10 - Fear not, for I am with you
  { book: 19, chapter: 28, verse: 7 }, // Psalm 28:7 - The Lord is my strength and shield
  
  // HOPE & FAITH
  { book: 24, chapter: 29, verse: 11 }, // Jeremiah 29:11 - Plans to prosper you
  { book: 45, chapter: 8, verse: 28 }, // Romans 8:28 - All things work together for good
  { book: 19, chapter: 42, verse: 11 }, // Psalm 42:11 - Hope in God
  { book: 25, chapter: 3, verse: 22 }, // Lamentations 3:22-23 - Great is His faithfulness
  { book: 58, chapter: 11, verse: 1 }, // Hebrews 11:1 - Faith is the substance of things hoped for
  { book: 20, chapter: 3, verse: 5 }, // Proverbs 3:5 - Trust in the Lord with all your heart
  { book: 19, chapter: 37, verse: 4 }, // Psalm 37:4 - Delight yourself in the Lord
  { book: 45, chapter: 15, verse: 13 }, // Romans 15:13 - God of hope
  
  // GUIDANCE & WISDOM  
  { book: 20, chapter: 3, verse: 6 }, // Proverbs 3:6 - In all your ways acknowledge Him
  { book: 19, chapter: 119, verse: 105 }, // Psalm 119:105 - Your word is a lamp
  { book: 59, chapter: 1, verse: 5 }, // James 1:5 - If any lacks wisdom, let him ask
  { book: 20, chapter: 16, verse: 9 }, // Proverbs 16:9 - Man plans his way, but the Lord directs
  { book: 23, chapter: 30, verse: 21 }, // Isaiah 30:21 - This is the way, walk in it
  { book: 19, chapter: 32, verse: 8 }, // Psalm 32:8 - I will instruct you and teach you
  { book: 20, chapter: 27, verse: 1 }, // Proverbs 27:1 - Do not boast about tomorrow
  
  // LOVE & GRACE
  { book: 43, chapter: 3, verse: 16 }, // John 3:16 - For God so loved the world
  { book: 45, chapter: 8, verse: 38 }, // Romans 8:38-39 - Nothing can separate us from God's love
  { book: 49, chapter: 2, verse: 8 }, // Ephesians 2:8 - By grace you have been saved
  { book: 62, chapter: 4, verse: 19 }, // 1 John 4:19 - We love Him because He first loved us
  { book: 62, chapter: 4, verse: 16 }, // 1 John 4:16 - God is love
  { book: 25, chapter: 3, verse: 22 }, // Lamentations 3:22 - His mercies are new every morning
  { book: 19, chapter: 103, verse: 8 }, // Psalm 103:8 - Compassionate and gracious
  
  // JOY & CELEBRATION
  { book: 19, chapter: 118, verse: 24 }, // Psalm 118:24 - This is the day the Lord has made
  { book: 16, chapter: 8, verse: 10 }, // Nehemiah 8:10 - The joy of the Lord is your strength
  { book: 19, chapter: 16, verse: 11 }, // Psalm 16:11 - In Your presence is fullness of joy
  { book: 50, chapter: 4, verse: 4 }, // Philippians 4:4 - Rejoice in the Lord always
  { book: 19, chapter: 126, verse: 3 }, // Psalm 126:3 - The Lord has done great things
  { book: 19, chapter: 30, verse: 5 }, // Psalm 30:5 - Weeping may endure for a night
  
  // PROVISION & CARE
  { book: 50, chapter: 4, verse: 19 }, // Philippians 4:19 - God will supply all your needs
  { book: 19, chapter: 23, verse: 4 }, // Psalm 23:4 - Even though I walk through the valley
  { book: 58, chapter: 13, verse: 5 }, // Hebrews 13:5 - I will never leave you nor forsake you
  { book: 19, chapter: 84, verse: 11 }, // Psalm 84:11 - No good thing will He withhold
  { book: 40, chapter: 6, verse: 26 }, // Matthew 6:26 - Look at the birds of the air
  { book: 59, chapter: 1, verse: 17 }, // James 1:17 - Every good and perfect gift
  
  // ANXIETY & WORRY
  { book: 50, chapter: 4, verse: 6 }, // Philippians 4:6 - Be anxious for nothing
  { book: 60, chapter: 5, verse: 7 }, // 1 Peter 5:7 - Cast all your anxiety on Him
  { book: 40, chapter: 6, verse: 34 }, // Matthew 6:34 - Do not worry about tomorrow
  { book: 19, chapter: 94, verse: 19 }, // Psalm 94:19 - Your comforts delight my soul
  
  // PURPOSE & CALLING
  { book: 49, chapter: 2, verse: 10 }, // Ephesians 2:10 - We are His workmanship
  { book: 47, chapter: 5, verse: 17 }, // 2 Corinthians 5:17 - New creation
  { book: 40, chapter: 5, verse: 16 }, // Matthew 5:16 - Let your light shine
  { book: 51, chapter: 3, verse: 17 }, // Colossians 3:17 - Whatever you do in word or deed
  { book: 24, chapter: 1, verse: 5 }, // Jeremiah 1:5 - Before I formed you in the womb
  { book: 20, chapter: 19, verse: 21 }, // Proverbs 19:21 - Many plans in a man's heart
  
  // PERSEVERANCE & ENDURANCE
  { book: 46, chapter: 10, verse: 13 }, // 1 Corinthians 10:13 - No temptation beyond what you can bear
  { book: 43, chapter: 16, verse: 33 }, // John 16:33 - In this world you will have trouble
  { book: 59, chapter: 1, verse: 12 }, // James 1:12 - Blessed is the man who endures
  { book: 48, chapter: 6, verse: 9 }, // Galatians 6:9 - Let us not grow weary in doing good
  { book: 58, chapter: 12, verse: 1 }, // Hebrews 12:1 - Run with endurance the race
  
  // PRAYER & RELATIONSHIP
  { book: 52, chapter: 5, verse: 17 }, // 1 Thessalonians 5:17 - Pray without ceasing
  { book: 19, chapter: 145, verse: 18 }, // Psalm 145:18 - The Lord is near to all who call
  { book: 40, chapter: 7, verse: 7 }, // Matthew 7:7 - Ask and it will be given
  { book: 43, chapter: 15, verse: 7 }, // John 15:7 - If you abide in Me
  { book: 19, chapter: 139, verse: 23 }, // Psalm 139:23 - Search me, O God
  
  // FORGIVENESS & REDEMPTION
  { book: 62, chapter: 1, verse: 9 }, // 1 John 1:9 - If we confess our sins
  { book: 19, chapter: 103, verse: 12 }, // Psalm 103:12 - As far as east is from west
  { book: 23, chapter: 43, verse: 25 }, // Isaiah 43:25 - I will not remember your sins
  { book: 49, chapter: 1, verse: 7 }, // Ephesians 1:7 - In Him we have redemption
  
  // ADDITIONAL MOTIVATIONAL VERSES
  { book: 19, chapter: 1, verse: 3 }, // Psalm 1:3 - Like a tree planted by rivers
  { book: 19, chapter: 139, verse: 14 }, // Psalm 139:14 - Fearfully and wonderfully made
  { book: 23, chapter: 55, verse: 11 }, // Isaiah 55:11 - My word shall not return void
  { book: 46, chapter: 15, verse: 58 }, // 1 Corinthians 15:58 - Be steadfast, immovable
  { book: 49, chapter: 3, verse: 20 }, // Ephesians 3:20 - Able to do exceedingly abundantly
  { book: 51, chapter: 3, verse: 23 }, // Colossians 3:23 - Whatever you do, work heartily
  { book: 58, chapter: 4, verse: 16 }, // Hebrews 4:16 - Come boldly to the throne of grace
  { book: 66, chapter: 21, verse: 4 }, // Revelation 21:4 - God will wipe away every tear
  
  // MORE COMFORT & ENCOURAGEMENT
  { book: 19, chapter: 121, verse: 1 }, // Psalm 121:1 - I will lift up my eyes to the hills
  { book: 19, chapter: 121, verse: 2 }, // Psalm 121:2 - My help comes from the Lord
  { book: 19, chapter: 91, verse: 1 }, // Psalm 91:1 - He who dwells in the secret place
  { book: 19, chapter: 91, verse: 11 }, // Psalm 91:11 - He shall give His angels charge
  { book: 19, chapter: 62, verse: 1 }, // Psalm 62:1 - Truly my soul silently waits for God
  { book: 19, chapter: 73, verse: 26 }, // Psalm 73:26 - My flesh and my heart fail
  { book: 23, chapter: 54, verse: 10 }, // Isaiah 54:10 - Mountains shall depart
  { book: 23, chapter: 61, verse: 3 }, // Isaiah 61:3 - Beauty for ashes
  
  // MORE STRENGTH & VICTORY
  { book: 19, chapter: 18, verse: 32 }, // Psalm 18:32 - It is God who arms me with strength
  { book: 19, chapter: 144, verse: 1 }, // Psalm 144:1 - Blessed be the Lord my Rock
  { book: 23, chapter: 40, verse: 29 }, // Isaiah 40:29 - He gives power to the weak
  { book: 50, chapter: 1, verse: 6 }, // Philippians 1:6 - He who has begun a good work
  { book: 45, chapter: 8, verse: 31 }, // Romans 8:31 - If God is for us, who can be against us?
  { book: 45, chapter: 8, verse: 37 }, // Romans 8:37 - We are more than conquerors
  { book: 47, chapter: 12, verse: 9 }, // 2 Corinthians 12:9 - My grace is sufficient
  { book: 62, chapter: 4, verse: 4 }, // 1 John 4:4 - Greater is He who is in you
  
  // MORE WISDOM & DIRECTION
  { book: 20, chapter: 2, verse: 6 }, // Proverbs 2:6 - The Lord gives wisdom
  { book: 20, chapter: 4, verse: 18 }, // Proverbs 4:18 - Path of the just is like shining light
  { book: 20, chapter: 11, verse: 14 }, // Proverbs 11:14 - Where there is no counsel
  { book: 20, chapter: 15, verse: 22 }, // Proverbs 15:22 - Without counsel, plans go awry
  { book: 20, chapter: 16, verse: 3 }, // Proverbs 16:3 - Commit your works to the Lord
  { book: 20, chapter: 18, verse: 10 }, // Proverbs 18:10 - The name of the Lord is a strong tower
  { book: 21, chapter: 3, verse: 1 }, // Ecclesiastes 3:1 - To everything there is a season
  { book: 33, chapter: 6, verse: 8 }, // Micah 6:8 - What does the Lord require of you?
  
  // MORE FAITH & TRUST
  { book: 19, chapter: 25, verse: 1 }, // Psalm 25:1 - To You, O Lord, I lift up my soul
  { book: 19, chapter: 40, verse: 1 }, // Psalm 40:1 - I waited patiently for the Lord
  { book: 19, chapter: 56, verse: 3 }, // Psalm 56:3 - Whenever I am afraid, I will trust
  { book: 19, chapter: 112, verse: 7 }, // Psalm 112:7 - He will not be afraid of evil tidings
  { book: 19, chapter: 125, verse: 1 }, // Psalm 125:1 - Those who trust in the Lord
  { book: 23, chapter: 12, verse: 2 }, // Isaiah 12:2 - Behold, God is my salvation
  { book: 23, chapter: 25, verse: 1 }, // Isaiah 25:1 - O Lord, You are my God
  { book: 58, chapter: 13, verse: 8 }, // Hebrews 13:8 - Jesus Christ is the same yesterday
  
  // MORE JOY & PRAISE
  { book: 19, chapter: 33, verse: 1 }, // Psalm 33:1 - Rejoice in the Lord, O you righteous
  { book: 19, chapter: 95, verse: 1 }, // Psalm 95:1 - Come, let us sing to the Lord
  { book: 19, chapter: 96, verse: 1 }, // Psalm 96:1 - Oh, sing to the Lord a new song
  { book: 19, chapter: 100, verse: 4 }, // Psalm 100:4 - Enter into His gates with thanksgiving
  { book: 19, chapter: 150, verse: 6 }, // Psalm 150:6 - Let everything that has breath praise
  { book: 16, chapter: 12, verse: 8 }, // Nehemiah 12:8 - The Levites were Jeshua, Binnui
  { book: 17, chapter: 4, verse: 14 }, // Esther 4:14 - For such a time as this
  { book: 19, chapter: 98, verse: 4 }, // Psalm 98:4 - Shout joyfully to the Lord
  
  // MORE LOVE & RELATIONSHIPS
  { book: 46, chapter: 13, verse: 4 }, // 1 Corinthians 13:4 - Love suffers long and is kind
  { book: 46, chapter: 13, verse: 7 }, // 1 Corinthians 13:7 - Bears all things, believes all things
  { book: 46, chapter: 13, verse: 13 }, // 1 Corinthians 13:13 - Now abide faith, hope, love
  { book: 51, chapter: 3, verse: 14 }, // Colossians 3:14 - Above all these things put on love
  { book: 62, chapter: 3, verse: 1 }, // 1 John 3:1 - Behold what manner of love
  { book: 43, chapter: 13, verse: 35 }, // John 13:35 - By this all will know that you are My disciples
  { book: 43, chapter: 15, verse: 12 }, // John 15:12 - This is My commandment, that you love
  { book: 40, chapter: 22, verse: 37 }, // Matthew 22:37 - Love the Lord your God
  
  // MORE SERVICE & PURPOSE
  { book: 48, chapter: 5, verse: 13 }, // Galatians 5:13 - Through love serve one another
  { book: 40, chapter: 25, verse: 40 }, // Matthew 25:40 - Inasmuch as you did it to one of the least
  { book: 41, chapter: 10, verse: 43 }, // Mark 10:43 - Whoever desires to become great
  { book: 60, chapter: 4, verse: 10 }, // 1 Peter 4:10 - As each one has received a gift
  { book: 49, chapter: 6, verse: 7 }, // Ephesians 6:7 - With goodwill doing service
  { book: 46, chapter: 12, verse: 31 }, // 1 Corinthians 12:31 - Earnestly desire the best gifts
  { book: 54, chapter: 6, verse: 18 }, // 1 Timothy 6:18 - Let them do good, that they be rich
  
  // MORE PATIENCE & ENDURANCE
  { book: 59, chapter: 5, verse: 7 }, // James 5:7 - Be patient, brethren, until the coming
  { book: 59, chapter: 5, verse: 8 }, // James 5:8 - You also be patient. Establish your hearts
  { book: 19, chapter: 27, verse: 1 }, // Psalm 27:1 - The Lord is my light and my salvation
  { book: 19, chapter: 130, verse: 5 }, // Psalm 130:5 - I wait for the Lord, my soul waits
  { book: 40, chapter: 24, verse: 13 }, // Matthew 24:13 - He who endures to the end
  { book: 66, chapter: 2, verse: 10 }, // Revelation 2:10 - Be faithful until death
  
  // MORE THANKFULNESS & GRATITUDE
  { book: 19, chapter: 136, verse: 1 }, // Psalm 136:1 - Oh, give thanks to the Lord, for He is good
  { book: 52, chapter: 5, verse: 18 }, // 1 Thessalonians 5:18 - In everything give thanks
  { book: 49, chapter: 5, verse: 20 }, // Ephesians 5:20 - Giving thanks always for all things
  { book: 51, chapter: 2, verse: 7 }, // Colossians 2:7 - Rooted and built up in Him
  { book: 51, chapter: 4, verse: 2 }, // Colossians 4:2 - Continue earnestly in prayer
  { book: 19, chapter: 107, verse: 1 }, // Psalm 107:1 - Oh, give thanks to the Lord
];

// Track recently used verses to reduce duplicates
const recentlyUsedVerses: string[] = [];
const MAX_RECENT_VERSES = 15; // Remember last 15 verses to avoid immediate duplicates

/**
 * Fetches a random encouraging Bible verse from the NKJV translation
 * Uses a curated list of encouraging verses with duplicate prevention
 */
export async function getRandomEncouragingVerse(): Promise<{ text: string; reference: string } | null> {
  try {
    // Use curated encouraging verses 90% of the time, random 10% of the time
    const useRandomVerse = Math.random() < 0.1;
    
    let verseData: BibleVerse;
    let attempts = 0;
    const maxAttempts = 5;
    
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
      // Pick from curated encouraging verses with duplicate prevention
      let randomVerse;
      let verseKey;
      
      do {
        randomVerse = ENCOURAGING_VERSES[Math.floor(Math.random() * ENCOURAGING_VERSES.length)];
        verseKey = `${randomVerse.book}:${randomVerse.chapter}:${randomVerse.verse}`;
        attempts++;
      } while (recentlyUsedVerses.includes(verseKey) && attempts < maxAttempts);
      
      // Add to recently used list
      recentlyUsedVerses.push(verseKey);
      if (recentlyUsedVerses.length > MAX_RECENT_VERSES) {
        recentlyUsedVerses.shift(); // Remove oldest
      }
      
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