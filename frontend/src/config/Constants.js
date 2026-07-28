export const LINKS = [
    { link: "/characters", label: "Characters" },
    { link: "/items", label: "Items" },
    { link: "/songs", label: "Songs" }
];

export const GAME_MODES = [
    {
        title: "Characters",
        description: "Guess the character using clues like gender, type, chapter, and class.",
        link: "/characters",
        badge: "Trivia",
        color: "cyberCyan"
    },
    {
        title: "Items",
        description: "Discover items and equipment based on their stats and locations.",
        link: "/items",
        badge: "Stats",
        color: "royalMagenta"
    },
    {
        title: "Songs",
        description: "Guess the soundtracks based on duration and chapter info.",
        link: "/songs",
        badge: "Audio",
        color: "emeraldGreen"
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