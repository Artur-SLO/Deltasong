export function getActiveUser() {
    const userStr = localStorage.getItem('deltasong_active_user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

export function registerUser(name, password, avatar) {
    if (!name || !password) throw new Error("Name and password are required");
    const users = JSON.parse(localStorage.getItem('deltasong_users') || '[]');
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase().trim())) {
        throw new Error("Username is already taken");
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newUser = {
        name: name.trim(),
        password: password,
        avatar: avatar || 'kris', // Default avatar key
        streak: 1,
        lastLogin: todayStr
    };

    users.push(newUser);
    localStorage.setItem('deltasong_users', JSON.stringify(users));
    localStorage.setItem('deltasong_active_user', JSON.stringify(newUser));
    
    // Dispatch a custom event to notify Header component of auth changes
    window.dispatchEvent(new Event('deltasong_auth_change'));
    return newUser;
}

export function loginUser(name, password) {
    if (!name || !password) throw new Error("Name and password are required");
    const users = JSON.parse(localStorage.getItem('deltasong_users') || '[]');
    const userIndex = users.findIndex(
        u => u.name.toLowerCase() === name.toLowerCase().trim() && u.password === password
    );

    if (userIndex === -1) {
        throw new Error("Invalid username or password");
    }

    const user = users[userIndex];
    const updatedUser = updateStreak(user);

    users[userIndex] = updatedUser;
    localStorage.setItem('deltasong_users', JSON.stringify(users));
    localStorage.setItem('deltasong_active_user', JSON.stringify(updatedUser));
    
    window.dispatchEvent(new Event('deltasong_auth_change'));
    return updatedUser;
}

export function updateActiveUserStreak() {
    const active = getActiveUser();
    if (!active) return null;

    const updated = updateStreak(active);
    const users = JSON.parse(localStorage.getItem('deltasong_users') || '[]');
    const userIndex = users.findIndex(u => u.name.toLowerCase() === active.name.toLowerCase());
    
    if (userIndex !== -1) {
        users[userIndex] = updated;
        localStorage.setItem('deltasong_users', JSON.stringify(users));
    }
    localStorage.setItem('deltasong_active_user', JSON.stringify(updated));
    return updated;
}

function updateStreak(user) {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLoginStr = user.lastLogin;

    if (lastLoginStr === todayStr) {
        return user; // Already logged in today, keep current streak
    }

    const today = new Date(todayStr);
    const lastLogin = new Date(lastLoginStr);
    const diffTime = Math.abs(today - lastLogin);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = user.streak;
    if (diffDays === 1) {
        newStreak += 1; // Consecutive day login
    } else if (diffDays > 1) {
        newStreak = 1; // Streak broken, reset to 1
    } else {
        newStreak = 1; // Fallback
    }

    return {
        ...user,
        streak: newStreak,
        lastLogin: todayStr
    };
}

export function logoutUser() {
    localStorage.removeItem('deltasong_active_user');
    window.dispatchEvent(new Event('deltasong_auth_change'));
}

export function updateUserAvatar(avatarUrl) {
    const active = getActiveUser();
    if (!active) return null;
    
    const updated = { ...active, avatar: avatarUrl };
    const users = JSON.parse(localStorage.getItem('deltasong_users') || '[]');
    const userIndex = users.findIndex(u => u.name.toLowerCase() === active.name.toLowerCase());
    
    if (userIndex !== -1) {
        users[userIndex] = updated;
        localStorage.setItem('deltasong_users', JSON.stringify(users));
    }
    localStorage.setItem('deltasong_active_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('deltasong_auth_change'));
    return updated;
}