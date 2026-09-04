/**
 * Legacy auth adapter module.
 * Bridges calls to the centralized Firebase authService.js
 */
export {
    getActiveUser,
    registerUser,
    loginUser,
    updateActiveUserStreak,
    logoutUser,
    updateUserAvatar
} from '../services/authService';