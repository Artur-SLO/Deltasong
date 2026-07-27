import { createTheme } from "@mantine/core";

export const theme = createTheme({
    fontFamily: 'Roboto, sans-serif',
    headings: { 
        fontFamily: 'Deltarune, Roboto, sans-serif' 
    },
    colors: {
        cyberCyan: [
            '#e0ffff', '#b3ffff', '#80ffff', '#4dffff', '#1affff',
            '#00e6e6', '#00b3b3', '#008080', '#004d4d', '#001f1f'
        ],
        royalMagenta: [
            '#ffe3f3', '#ffd0ea', '#ffa7d6', '#ff78bd', '#ff47a2',
            '#ff1f8e', '#d90073', '#b3005f', '#8c004a', '#660036'
        ],
        emeraldGreen: [
            '#e5ffe8', '#cdffd5', '#9cffa9', '#66ff7b', '#33ff52',
            '#00ff27', '#00d420', '#00a819', '#007d13', '#00520c'
        ],
        spadeBlue: [
            '#e6f0ff', '#ccdfff', '#99beff', '#669cff', '#337aff',
            '#0058f2', '#004bc4', '#003e9c', '#003078', '#002357'
        ]
    },
    primaryColor: 'cyberCyan',
    primaryShade: 6
});
