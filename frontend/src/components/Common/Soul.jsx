import React from 'react';
import { SOUL_COLORS } from '../../config/Constants.js';
import styles from '../../styles/Soul.module.css';
import soulPng from '../../assets/images/soul.png';

export { SOUL_COLORS, soulPng };

export function getRandomSoulColors(count = 3) {
    const shuffled = [...SOUL_COLORS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(s => s.hex);
}

// Exact 16x16 Undertale SOUL heart path matching user reference image
const EXACT_SOUL_PATH = "M 2,0 L 4,0 L 4,1 L 6,1 L 6,2 L 7,2 L 7,4 L 9,4 L 9,2 L 10,2 L 10,1 L 12,1 L 12,0 L 14,0 L 14,1 L 15,1 L 15,2 L 16,2 L 16,10 L 14,10 L 14,12 L 12,12 L 12,14 L 10,14 L 10,16 L 6,16 L 6,14 L 4,14 L 4,12 L 2,12 L 2,10 L 0,10 L 0,2 L 1,2 L 1,1 L 2,1 Z";

export default function Soul({ color = '#ff2222', isAlive = true, size = 22 }) {
    if (!isAlive) {
        return (
            <svg
                viewBox="0 0 16 16"
                width={size}
                height={size}
                shapeRendering="crispEdges"
                className={`${styles.soulBase} ${styles.soulDead}`}
            >
                <path
                    d={EXACT_SOUL_PATH}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="2 1"
                />
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 16 16"
            width={size}
            height={size}
            shapeRendering="crispEdges"
            className={`${styles.soulBase} ${styles.soulAlive}`}
            style={{ '--soul-glow': `${color}aa` }}
        >
            <path
                d={EXACT_SOUL_PATH}
                fill={color}
            />
        </svg>
    );
}
