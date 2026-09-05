/**
 * Rank system interface.
 * All mutations and rank data access converge to the centralized scoreService.js.
 */
export {
    getRankData,
    addPoints,
    calculateUserRank
} from '../services/scoreService';
