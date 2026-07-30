import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import classes from '../../styles/HelpWidget.module.css';

// Import character mascots in GIF format
import berdlyGif from '../../assets/berdly.gif';
import rouxlsGif from '../../assets/rouxls.gif';
import jevilGif from '../../assets/jevil.gif';
import spamtonGif from '../../assets/spamton.gif';
import lancerGif from '../../assets/lancer.gif';
import susieGif from '../../assets/susie.gif';
import gersonGif from '../../assets/gerson.gif'

export function HelpWidget({ currentGame }) {
    const [showHint, setShowHint] = useState(false);
    const location = useLocation();
    const widgetRef = useRef(null);

    // Dynamic hint and mascot configuration by minigame/route
    const gameHints = {
        characters: {
            hero: berdlyGif,
            title: "How to Play: Characters",
            cards: [
                "Oh? A simpleton dares to challenge my vast database of Deltarune knowledge? Truly pathetic!",
                "Green indicates an exact match, teal means nearby, red is dead wrong, and arrows display numerical hierarchy.",
                "Do try to formulate an educated guess, 'gamer'. Watching your intellectual struggle is physically painful!"
            ]
        },
        items: {
            hero: rouxlsGif,
            title: "How to Play: Items",
            isLarge: true,
            cards: [
                "Hearken, Worm! Thou must guess mine Item of choice in the fewest attempts!",
                "With each Failure, a new property is revealed",
                "Prepareth to be utterly confounded by my glorious, unsolvable puzzle!"
            ]
        },
        song: {
            hero: jevilGif,
            title: "How to Play: Song",
            cards: [
                "CHAOS, CHAOS! Listen to the audio and guess the song, guess the song!",
                "Adjust difficulty to change how much time you get to hear, hear! More seconds, less points!",
                "THE WORLD REVOLVES, AND SO DOES THE TRACK! GUESS IT IF YOU CAN, CAN!"
            ]
        },
        daily: {
            hero: spamtonGif,
            title: "How to Play: Daily Challenge",
            cards: [
                "PLAY ALL [3 GAMES] IN A ROW TO WIN [Wild Prizes] AND BECOME A [BIG SHOT]!!! FIRST THE [Miniature Characters], THEN THE [Value-Priced Items], AND FINALLY... THE [Top 10 Hits]!!",
                "YOUR [Total Speedrun Time] AND [Useless Guesses Used] WILL BE [Forcefully Copied] TO YOUR [Clipboard] FOR ALL YOUR [100th Customer Friends] TO SEE AND [Jealous!!] DO IT NOW, NOW, [NOW]!!"
            ]
        },
        home: {
            hero: lancerGif,
            title: "How to Play: Deltasong",
            isLarge: true,
            cards: [
                "Ho-ho-ho! I am the bad guy! Or the good guy? I don't know, but you should click these cool game buttons!",
                "If you win, my lesser dad might let me eat more cookies! Or chalk! Susie says chalk is delicious!",
                "Make an account to save your awesome streaks!"
            ]
        },
        account: {
            hero: gersonGif,
            title: "Your Account & Stats",
            cards: [
                "Gyaa Ha ha! Looking for your old battles records, eh? This is where all your stats and hot streaks are recorded!",
                "Back in my day, we didn't have fancy avatars! But if you wanna swap yours for a better look, go right ahead, kid!",
                "All your history is carved right into your browser's local cache... so don't go wiping it clean unless you want your legend forgotten! Gyaa Ha ha!"
            ]
        }
    };

    // Auto-detection based on the route if currentGame is not provided
    const getGameFromPath = (path) => {
        if (path === '/characters') return 'characters';
        if (path === '/items') return 'items';
        if (path === '/songs') return 'song';
        if (path === '/daily') return 'daily';
        if (path === '/account') return 'account';
        return 'home';
    };

    const resolvedGame = currentGame || getGameFromPath(location.pathname);
    const currentConfig = gameHints[resolvedGame] || gameHints.home;

    // Close hint if user clicks outside of the widget container
    useEffect(() => {
        if (!showHint) return;

        const handleOutsideClick = (event) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target)) {
                setShowHint(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [showHint]);

    return (
        <footer ref={widgetRef} className={classes.footerContainer}>
            {showHint && (
                <div className={classes.hintPopup}>
                    <div className={classes.hintHeader}>
                        <span className={classes.hintTitle}>{currentConfig.title}</span>
                        <button
                            className={classes.closeButton}
                            onClick={() => setShowHint(false)}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                    <div className={classes.hintCards}>
                        {currentConfig.cards.map((text, idx) => (
                            <p key={idx} className={classes.hintCardText}>
                                {text}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            <div className={`${classes.mascotContainer} ${currentConfig.isLarge ? classes.largeMascot : ''}`}>
                <img
                    key={resolvedGame}
                    src={currentConfig.hero}
                    alt="Help Mascot"
                    className={classes.hintHero}
                    onClick={() => setShowHint((prev) => !prev)}
                />
            </div>
        </footer>
    );
}

export default HelpWidget;
