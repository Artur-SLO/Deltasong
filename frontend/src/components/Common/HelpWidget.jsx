import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import classes from '../../styles/HelpWidget.module.css';

// Import character mascots in GIF format
import berdlyGif from '../../assets/berdly.gif';
import rouxlsGif from '../../assets/rouxls.gif';
import jevilGif from '../../assets/jevil.gif';
import spamtonGif from '../../assets/spamton.gif';
import lancerGif from '../../assets/lancer.gif';
import susieGif from '../../assets/susie.gif';

export function HelpWidget({ currentGame }) {
    const [showHint, setShowHint] = useState(false);
    const location = useLocation();

    // Dynamic hint and mascot configuration by minigame/route
    const gameHints = {
        characters: {
            hero: berdlyGif,
            title: "How to Play: Characters",
            cards: [
                "Oh? A simpleton dares to test their intellect against my vast database of Deltarune characters?",
                "Green indicates an exact match, yellow is close, and arrows indicate if the value (Chapter) is higher or lower.",
                "Do try to make an educated guess, gamer. It is painful to watch you struggle!"
            ]
        },
        items: {
            hero: rouxlsGif,
            title: "How to Play: Items",
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
                "Chaos, chaos! Listen to the audio and guess the song, guess the song!",
                "Adjust difficulty to change the duration of audio you can hear, hear!",
                "The world revolves, and so does the track! Guess it if you can, can!"
            ]
        },
        daily: {
            hero: spamtonGif,
            title: "How to Play: Daily Challenge",
            cards: [
                "PLAY ALL THREE [Games] IN A ROW TO BE A [BIG SHOT]!!! FIRST THE CHARACTER, THEN THE ITEM, THEN THE SONG!",
                "YOUR TIME AND HINTS WILL BE COPIED TO THE CLIPBOARD FOR ALL YOUR FRIEND TO SEE!!! DO IT NOW, NOW, NOW!!!"
            ]
        },
        home: {
            hero: lancerGif,
            title: "How to Play: Deltasong",
            cards: [
                "Ho-ho-ho! I am the bad guy! Or the good guy? I don't know, but you should click these cool game buttons!",
                "If you win, my lesser dad might let me eat more cookies! Or chalk! Susie says chalk is delicious!",
                "Make an account to save your awesome streaks!"
            ]
        },
        account: {
            hero: susieGif,
            title: "Your Account & Stats",
            cards: [
                "Hey. This is where your local save data and win streaks are kept.",
                "Click on your avatar if you want to swap it for a cooler sprite.",
                "Everything is saved locally on your browser, so don't mess it up, alright?"
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

    return (
        <footer className={classes.footerContainer}>
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

            <div className={classes.mascotContainer}>
                <img
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
