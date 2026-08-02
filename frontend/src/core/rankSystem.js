import { getActiveUser } from '../utils/auth';
import { notifications } from '@mantine/notifications';

import { RANK_TIERS, RANK_POINTS } from '../config/Constants';

export function getRankData() {
    const activeUser = getActiveUser();
    const username = activeUser ? activeUser.name.toLowerCase() : 'guest';
    const key = `deltasong_rank_data_${username}`;
    
    const stored = localStorage.getItem(key);
    const fallback = {
        totalScore: 0,
        streak: activeUser ? activeUser.streak : 0,
        stats: {
            charactersPlayed: 0,
            itemsPlayed: 0,
            songsPlayed: 0,
            charactersWon: 0,
            itemsWon: 0,
            songsWon: 0,
            dailyCompleted: 0,
            totalWins: 0,
            totalLosses: 0
        }
    };
    
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
    }
    
    try {
        const parsed = JSON.parse(stored);
        parsed.stats = { ...fallback.stats, ...parsed.stats };
        
        // Handle streak logic for logged in users
        if (activeUser) {
            const oldStreak = parsed.streak || 0;
            const newStreak = activeUser.streak || 0;
            
            // If the user's active streak drops to 1, and our saved streak was > 1,
            // the streak was broken! Apply the -100 pts penalty.
            if (newStreak === 1 && oldStreak > 1) {
                const oldScore = parsed.totalScore;
                parsed.totalScore = Math.max(0, parsed.totalScore - RANK_POINTS.STREAK_BREAK_PENALTY);
                parsed.streak = newStreak;
                
                // Save updated data
                localStorage.setItem(key, JSON.stringify(parsed));
                
                // Show notification if score actually dropped
                if (oldScore > parsed.totalScore) {
                    setTimeout(() => {
                        notifications.show({
                            title: 'Streak Broken!',
                            message: `You missed a day! Your streak has reset to 1 and you lost ${RANK_POINTS.STREAK_BREAK_PENALTY} points.`,
                            color: 'red',
                            autoClose: 5000
                        });
                    }, 100);
                }
            } else {
                parsed.streak = newStreak;
                localStorage.setItem(key, JSON.stringify(parsed));
            }
        } else {
            // For guests, clear streak sync
            parsed.streak = 0;
        }
        
        return parsed;
    } catch (e) {
        return fallback;
    }
}

export function saveRankData(data) {
    const activeUser = getActiveUser();
    const username = activeUser ? activeUser.name.toLowerCase() : 'guest';
    const key = `deltasong_rank_data_${username}`;
    localStorage.setItem(key, JSON.stringify(data));
}

export function calculateUserRank(score) {
    let activeTier = RANK_TIERS[0];
    for (let i = 0; i < RANK_TIERS.length; i++) {
        if (score >= RANK_TIERS[i].min) {
            activeTier = RANK_TIERS[i];
        }
    }
    
    let progressValue = 0;
    if (activeTier.grade === 'T') {
        progressValue = Math.min(100, Math.round(((score - activeTier.min) / activeTier.span) * 100));
    } else {
        progressValue = Math.round(((score - activeTier.min) / activeTier.span) * 100);
    }
    
    progressValue = Math.max(0, Math.min(100, progressValue));
    
    return {
        grade: activeTier.grade,
        progressValue,
        color: activeTier.color,
        label: activeTier.label,
        message: activeTier.message,
        nextTierMin: activeTier.grade === 'T' ? null : RANK_TIERS[RANK_TIERS.indexOf(activeTier) + 1].min
    };
}

export function addPoints(amount, gameType, isDailyWin = true) {
    const data = getRankData();
    const oldScore = data.totalScore;
    const newScore = Math.max(0, oldScore + amount);
    
    data.totalScore = newScore;
    
    // Update stats based on gameType and amount
    if (gameType === 'characters') {
        data.stats.charactersPlayed += 1;
        if (amount > 0) {
            data.stats.totalWins += 1;
            data.stats.charactersWon = (data.stats.charactersWon || 0) + 1;
        } else {
            data.stats.totalLosses += 1;
        }
    } else if (gameType === 'items') {
        data.stats.itemsPlayed += 1;
        if (amount > 0) {
            data.stats.totalWins += 1;
            data.stats.itemsWon = (data.stats.itemsWon || 0) + 1;
        } else {
            data.stats.totalLosses += 1;
        }
    } else if (gameType === 'songs') {
        data.stats.songsPlayed += 1;
        if (amount > 0) {
            data.stats.totalWins += 1;
            data.stats.songsWon = (data.stats.songsWon || 0) + 1;
        } else {
            data.stats.totalLosses += 1;
        }
    } else if (gameType === 'daily') {
        if (isDailyWin && amount > 0) {
            data.stats.dailyCompleted += 1;
            data.stats.totalWins += 1;
        } else {
            data.stats.totalLosses += 1;
        }
    }
    
    saveRankData(data);
    
    // Check for rank change notification
    const oldRank = calculateUserRank(oldScore);
    const newRank = calculateUserRank(newScore);
    
    if (oldRank.grade !== newRank.grade) {
        const isUp = RANK_TIERS.findIndex(t => t.grade === newRank.grade) > RANK_TIERS.findIndex(t => t.grade === oldRank.grade);
        
        setTimeout(() => {
            notifications.show({
                title: isUp ? 'RANK UP!' : 'RANK DOWN...',
                message: isUp 
                    ? `Fantastic! You reached ${newRank.label} (${newRank.grade} Rank)!` 
                    : `Oh no! You dropped to ${newRank.label} (${newRank.grade} Rank).`,
                color: isUp ? 'emeraldGreen' : 'red',
                autoClose: 5000
            });
        }, 100);
    }
    
    window.dispatchEvent(new Event('deltasong_rank_change'));
    return data;
}

// Dev Mode console helpers integration
if (import.meta.env.DEV) {
    window.deltasongDev = window.deltasongDev || {};
    window.deltasongDev.addPoints = (amount) => {
        addPoints(amount, 'dev');
        console.log(`[Dev] Points changed by ${amount}. New total: ${getRankData().totalScore}`);
    };
    window.deltasongDev.setPoints = (score) => {
        const data = getRankData();
        const oldScore = data.totalScore;
        data.totalScore = Math.max(0, score);
        saveRankData(data);
        
        // Trigger rank changes notifications
        const oldRank = calculateUserRank(oldScore);
        const newRank = calculateUserRank(data.totalScore);
        if (oldRank.grade !== newRank.grade) {
            const isUp = RANK_TIERS.findIndex(t => t.grade === newRank.grade) > RANK_TIERS.findIndex(t => t.grade === oldRank.grade);
            notifications.show({
                title: isUp ? 'RANK UP!' : 'RANK DOWN...',
                message: isUp 
                    ? `Fantastic! You reached ${newRank.label} (${newRank.grade} Rank)!` 
                    : `Oh no! You dropped to ${newRank.label} (${newRank.grade} Rank).`,
                color: isUp ? 'emeraldGreen' : 'red',
                autoClose: 5000
            });
        }
        
        window.dispatchEvent(new Event('deltasong_rank_change'));
        console.log(`[Dev] Points set to ${data.totalScore}.`);
    };
}

