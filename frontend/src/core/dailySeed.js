export function getLocalDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function createPRNG(seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    let a = hash >>> 0;
    
    // Mulberry32
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function getDailyNumber(dateStr) {
    const epoch = new Date("2026-01-01T00:00:00");
    let current;
    if (dateStr) {
        current = new Date(`${dateStr}T00:00:00`);
    } else {
        current = new Date();
    }
    
    const currentMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
    const epochMidnight = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate(), 0, 0, 0, 0);
    
    const diffTime = currentMidnight.getTime() - epochMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}