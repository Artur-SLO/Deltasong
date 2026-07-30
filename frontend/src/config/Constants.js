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
