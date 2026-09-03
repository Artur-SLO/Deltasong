import krisBattleGif from '../assets/images/characters/kris.gif';
import susieBattleGif from '../assets/images/characters/susie.gif';
import ralseiBattleGif from '../assets/images/characters/ralsei.gif';

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
    easy: { label: 'Easy', duration: 5.0, color: 'emeraldGreen', hexColor: '#00ff27' },
    medium: { label: 'Medium', duration: 2.5, color: 'yellow', hexColor: '#ffd43b' },
    hard: { label: 'Hard', duration: 1.0, color: 'red', hexColor: '#ff5252' },
    madness: { label: 'Madness', duration: 0.5, color: 'royalMagenta', hexColor: '#ff1f8e' },
    normal: { label: 'Medium', duration: 2.5, color: 'yellow', hexColor: '#ffd43b' }
};

export const DIFFICULTY_HEX = {
    easy: '#00ff27',
    medium: '#ffd43b',
    normal: '#ffd43b',
    hard: '#ff5252',
    madness: '#ff1f8e'
};

export const SOUL_COLORS = [
    { name: 'Determination', hex: '#ff2222' },
    { name: 'Bravery', hex: '#ff7f00' },
    { name: 'Justice', hex: '#ffd43b' },
    { name: 'Kindness', hex: '#00ff27' },
    { name: 'Patience', hex: '#00ffff' },
    { name: 'Integrity', hex: '#0B00F3' },
    { name: 'Perseverance', hex: '#a855f7' }
];

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
    characters: 10,
    items: 10,
    songs: 10
};

export const GAME_MODE_SPRITES = {
    "Characters": krisBattleGif,
    "Items": susieBattleGif,
    "Song": ralseiBattleGif
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

    ATTEMPTS_THRESHOLD_FAST: 4,
    ATTEMPTS_THRESHOLD_MEDIUM: 7,

    SPEED_BONUS: 30,
    SPEED_THRESHOLD_SECONDS: 30,
    GIVE_UP_PENALTY: 30,
    SONG_HINT_PENALTY: 10
};

import pinkGif from '../assets/images/pink.gif';
import seamGif from '../assets/images/seam.gif';
import jackensteinGif from '../assets/images/jackenstein.gif';

export const STAGE_MASCOTS = {
    1: pinkGif,
    2: seamGif,
    3: jackensteinGif
};

export const RUSH_STAGES = [
    {
        id: 'easy',
        label: 'Easy',
        duration: 5.0,
        points: 30,
        color: 'emeraldGreen',
        hexColor: '#00ff27'
    },
    {
        id: 'medium',
        label: 'Medium',
        duration: 2.5,
        points: 50,
        color: 'yellow',
        hexColor: '#ffd43b'
    },
    {
        id: 'hard',
        label: 'Hard',
        duration: 1.0,
        points: 80,
        color: 'red',
        hexColor: '#ff5252'
    },
    {
        id: 'madness',
        label: 'Madness',
        duration: 0.5,
        points: 150,
        color: 'royalMagenta',
        hexColor: '#ff1f8e'
    }
];

export const RUSH_POINTS = {
    COMPLETION_BONUS: 90,
    SPEED_BONUS_PER_STAGE: 5,
    SPEED_THRESHOLD_SECONDS: 10,
    MAX_PERFECT_SCORE: 400
};

export const RUSH_LIVES = 5;

const EASY_AND_MEDIUM_POOL = [
    "A CYBER'S WORLD?", 'A DARK ZONE', 'A Town Called Hometown', 'ANOTHER HIM',
    'Attack of the Killer Queen', 'Beginning', 'Berdly', 'BIG SHOT',
    'Black Knife', 'BURNING EYES', 'Card Castle', 'Catswing',
    'Chaos King', 'Checker Dance', 'Cutie Mew Mew Magic', 'Dark Sanctuary',
    'Deal Gone Wrong', "Don't Forget", 'Empty Town', 'Faint Courage (Game Over)',
    'Faint Glow', 'Ferris Wheel', 'Festival', 'Field of Hopes and Dreams',
    'Flower Castle', 'Flower King', 'Flower Man', 'Garden of Hopes and Dreams',
    'Giga Size', 'GUARDIAN', 'Hammer of Justice', "It's Pronounced \"Rules\"",
    "It's TV Time!", 'Lancer', 'Lost Girl', 'My Castle Town',
    'Neverending Night', 'Pandora Palace', 'Petal Dance', 'Queen',
    'Raise Up Your Bat', 'Rouxls Kaard', 'Rude Buster',
    'Running Sky', 'sans.', 'Scarlet Forest', 'School',
    'Smart Race', 'Spamton', 'Sunset of Seven Suns', 'Susie',
    'The Dark Truth', 'THE WORLD REVOLVING', 'TV WORLD',
    'Until Next Time', 'Vs. Lancer', 'Vs. Susie', 'The Legend',
    'You Can Always Come Home', 'Ever Higher', 'Fireplace',
];

const HARD_AND_MADNESS_POOL = [
    '12am', '13am', '4rd Sanctuary', 'A Real Boy!', 'Thrash Machine', 'WELCOME TO THE CITY',
    'A Simple Diversion', 'Acid Tunnel of Love', 'Adventure Board', 'Air Waves',
    'Almost to the Guys!', "And Now For Today's Sponsors…!", 'Another day in hometown', 'April 2012',
    'ATRIUM', 'Basement', 'Beautiful Bathtime', 'Before the Story', 'With Hope Crossed On Our Hearts', 
    'Berdly (Rejected Concept)', 'Big City Board', 'BIT ROOTS', 'Bluebird of Misfortune',
    'Board Clear!', 'Bratfession...?', 'Breath', 'C', 'Who might you be?', 
    'Castle Funk', 'Catfession...?', 'Chill Jailbreak Alarm to Study and Relax to', 'Cliffs',
    'Concert for you', 'Cool Beat', 'Cool Mixtape', 'Crickets',
    'Crumbling Tower', 'Cyber Battle (Solo)', 'Dark Place', 'Darkness Falls',
    'Dialtone', 'Dig! Dig! To The Center of the Earth!', 'Digital Roots', 'Doom Board',
    'Dreamwatchers', 'Dump', 'Elegant Entrance', 'ERAM',
    'Fanfare (from "Rose of Winter")', 'Feature Presentation', 'Flashback (Excerpt)',
    'Flower Foyer', 'Flying Feather', 'Friends',  'Ruder Buster',
    'Friendship', 'From Now On (Battle 2)', 'Gallery', 'Gingerbread House',
    'Girl Next Door', 'GLACEIR', 'Glowing Snow', 'Goodnight, Sweet Prince',
    'Gyaa Ha ha!', 'Hall of Fame', 'Heavy Footsteps', 'HEY EVERY !',
    'Hip Shop', 'Holiday Studio', 'Hymn', "I guess I'm in love",
    "I'm Telling!", "I'm Very Bad", 'Imminent Death', 'Inappropriate Recycling',
    'KEYGEN', 'KING OF ROLYPOLY', 'Knock You Down !!', 'Knock You Down!! (Rhythm Ver.)',
    'Lantern', 'Loving Steps', 'Metaphysical Challenge', 'MIKE, the BOARD, please!',
    'Mini Studio', 'Mysterious Ringing', 'Need a hand!?', 'NORTHERNLIGHT',
    "NOW'S YOUR CHANCE TO BE A", 'Ohhhhohohoho!', 'Old wooden rafters', 'Onsen',
    'Paradise, Paradise', 'Physical Challenge', 'Piano that may not be played that well', 'Pink',
    'Pirate Dojo', 'Powers Combined', 'Pushing Buddies', 'Query?',
    'Quiet Autumn', 'Quiet Glade', 'Quiz!', 'Raft Ride',
    'Rakuichi Buster', 'Ride the Board', 'Ripple', 'Sandy Board',
    'Scarlet Forest (DELTARUNE Piano Collections, Vol. 1)', 'Shop 3', 'Sound Check', 'Sound Studio',
    'SOUTH OF THE BORDER!!', 'SPAWN', 'Stop, Criminell!', 'SWORD',
    'That Day', 'The Chase', 'The Circus', 'The Diner Song of Best Friends',
    'The distance between two', 'The Door', 'THE HOLY', 'The LEGEND…?',
    "The Ol' Jitterbug", 'The place where it rained', 'The Second Sanctuary',
    'The Third Sanctuary', 'Thousand Cafe Zukan', 'Vapor Buster', 'Violet Tactics',
    'Volume Adjustment', 'Walking Home', 'Weak Flowers', 'Weird Birds',
    'Weirder Birds', 'Welcome to the Green Room', 'When I Get Happy I Dance Like This',
    'When I Get Mad I Dance Like This', 'Wise words', "Your Dad's Best Friend", 'Your Power',
];

const FULL_RUSH_POOL = [...EASY_AND_MEDIUM_POOL, ...HARD_AND_MADNESS_POOL];

export const RUSH_CURATED_POOLS = {
    easy: EASY_AND_MEDIUM_POOL,
    medium: EASY_AND_MEDIUM_POOL,

    hard: FULL_RUSH_POOL,
    madness: FULL_RUSH_POOL
};
