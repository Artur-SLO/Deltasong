export const LINKS = [
    { link: "/daily", label: "Daily" },
    { link: "/characters", label: "Characters" },
    { link: "/items", label: "Items" },
    { link: "/songs", label: "Song" },
];

export const GAME_MODES = [
    {
        title: "Characters",
        description: "Guess the character using clues like gender, type, chapter, and class.",
        link: "/characters",
        badge: "Classic",
        color: "cyberCyan"
    },
    {
        title: "Items",
        description: "Discover items and equipment based on their stats and locations.",
        link: "/items",
        badge: "Description",
        color: "royalMagenta"
    },
    {
        title: "Song",
        description: "Guess the soundtracks based on duration and chapter info.",
        link: "/songs",
        badge: "Audio",
        color: "emeraldGreen"
    },
    {
        title: "Daily Challenge",
        description: "A continuous 3-stage marathon: Characters ➔ Items ➔ Song. 1 attempt per day!",
        link: "/daily",
        badge: "Daily",
        color: "spadeBlue"
    }
];

export const COLUMNS_CONFIG = [
    { label: 'IMAGE', key: 'image', span: 2 },
    { label: 'NAME', key: 'name', span: 2 },
    { label: 'CHAPTER', key: 'chapter', span: 2 },
    { label: 'GENDER', key: 'gender', span: 2 },
    { label: 'TYPE', key: 'type', span: 2 },
    { label: 'ROLE', key: 'class', span: 2 },
    { label: 'FIRST APPEARANCE', key: 'first_appearance', span: 3 }
];

export const SONG_DIFFICULTIES = {
    easy: { label: 'Easy', duration: 5.0, color: 'emeraldGreen' },
    normal: { label: 'Normal', duration: 3.0, color: 'cyberCyan' },
    hard: { label: 'Hard', duration: 1.5, color: 'spadeBlue' },
    madness: { label: 'Madness', duration: 0.5, color: 'royalMagenta' }
};

export const ITEM_CATEGORIES = [
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Armor', label: 'Armor' },
    { value: 'Weapons', label: 'Weapons' },
    { value: 'Key Items', label: 'Key Items' },
    { value: 'Light World items', label: 'Light World' }
];

export const ITEM_DETAILS_CONFIG = [
    { label: 'Type', key: 'type' },
    { label: 'Description', key: 'description' },
    { label: 'Effects', key: 'effects' },
    { label: 'Buy Price', key: 'buy' },
    { label: 'Source', key: 'source' }
];

export const DAILY_LIMITS = {
    characters: 8,
    items: 5,
    songs: 8
};

export const GAME_MODE_SPRITES = {
    "Characters": "https://deltarune.wiki/images/Kris_battle_idle.gif?cb=dpui8e&h=thumb.php&f=Kris_battle_idle.gif",
    "Items": "https://deltarune.wiki/images/Susie_battle_serious.gif?cb=s2z2tj&h=thumb.php&f=Susie_battle_serious.gif",
    "Song": "https://deltarune.wiki/images/Ralsei_battle_serious.gif?cb=ktm22m&h=thumb.php&f=Ralsei_battle_serious.gif"
};

export const GAME_MODE_HOVER_COLORS = {
    cyberCyan: '#00ffff',
    royalMagenta: '#ff1f8e',
    emeraldGreen: '#00ff27'
};

export const GAME_MODE_SHADOW_COLORS = {
    cyberCyan: 'rgba(0, 255, 255, 0.4)',
    royalMagenta: 'rgba(255, 31, 142, 0.4)',
    emeraldGreen: 'rgba(0, 255, 39, 0.4)'
};

export const RANK_TIERS = [
  { 
    grade: "Z", 
    min: 0, 
    max: 299, 
    span: 300, 
    color: "gray.6", 
    label: "DISCARDED VESSEL", 
    message: "YOUR CREATION WAS DISCARDED. NO ONE CAN CHOOSE WHO THEY ARE IN THIS WORLD... DARK, DARKER, YET DARKER." 
  },
  { 
    grade: "C", 
    min: 300, 
    max: 999, 
    span: 700, 
    color: "yellow.4", 
    label: "BIG SHOT", 
    message: "NOW'S YOUR CHANCE TO BE A [BIG SHOT]!! DON'T BELIEVE [Anything You See On TV!] THE MAN'S A CRIMINAL!!"
  },
  { 
    grade: "B",
    min: 1000, 
    max: 2499, 
    span: 1500, 
    color: "blue.6", 
    label: "BAD GUYS SQUAD", 
    message: "Step one: I thrash you. Step two: You lose! Halt, clowns! This bike is fueled by victory!!!" 
  },
  { 
    grade: "A", 
    min: 2500, 
    max: 4999, 
    span: 2500, 
    color: "grape.4", 
    label: "TRUE GENIUS",
    message: "*pushes up glasses* I, the master tactician, have analyzed your stats! This win is NOT luck... it is my ultimate tactic!" 
  },
  { 
    grade: "S", 
    min: 5000, 
    max: 9999, 
    span: 5000, 
    color: "green.4", 
    label: "PROPHECY BUSTER", 
    message: "Gyaa Ha Ha! The White Pen of Hope writes your name into legend! Old man approves your mighty streak, kid!" 
  },
  { 
    grade: "T", 
    min: 10000, 
    max: Infinity, 
    span: 10000, 
    color: "pink.3", 
    label: "TV STAR", 
    message: "It's TV Ti... m... m... m...\n\nTHIS NEXT EXPERIMENT\n\nSEEMS\n\nVERY\n\nVERY\n\nINTERESTING\n\n❄︎♒︎♋︎■︎🙵⬧︎ ♐︎□︎❒︎ ◻︎●︎♋︎⍓︎♓︎■︎♑︎ ⧫︎♒︎♓︎⬧︎ ♐︎♋︎❒︎📬︎" 
  }
];

export const RANK_POINTS = {
    DAILY_VICTORY_BASE: 250,
    DAILY_STREAK_BONUS: 25,
    STREAK_BREAK_PENALTY: 50,
    
    VICTORY_FAST_ATTEMPTS: 80,
    VICTORY_MEDIUM_ATTEMPTS: 50,
    VICTORY_SLOW_ATTEMPTS: 25,

    SPEED_BONUS: 30,
    SPEED_THRESHOLD_SECONDS: 30,
    GIVE_UP_PENALTY: 30
};

