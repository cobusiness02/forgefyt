// Authentication System for FitCoach Pro
// This script should be included in all protected pages

// Check if user is authenticated
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('fitcoach_user') || 'null');
    
    // If no user data or not logged in, redirect to login
    if (!user || !user.isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }
    
    // Check if session has expired (24 hours for non-remember me, 30 days for remember me)
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    const maxHours = user.rememberMe ? 24 * 30 : 24; // 30 days or 24 hours
    
    if (hoursDiff > maxHours) {
        logout();
        return false;
    }
    
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('fitcoach_user');
    window.location.href = 'index.html';
}

// Get current user data
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('fitcoach_user') || 'null');
}

// Update user display name in header
function updateUserDisplay() {
    const user = getCurrentUser();
    if (user) {
        // Update any elements with class 'user-name'
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = user.name;
        });
        
        // Update any spans that contain user info
        const userInfoSpans = document.querySelectorAll('.user-info span');
        userInfoSpans.forEach(span => {
            if (span.textContent.includes('Coach') || span.textContent.includes('Welcome')) {
                span.textContent = `Welcome back, ${user.name}`;
            }
        });
    }
}

// Add logout functionality to logout buttons
function addLogoutHandlers() {
    const logoutButtons = document.querySelectorAll('.logout-btn, .logout-link');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only check auth if not on login page
    if (!window.location.pathname.includes('login.html')) {
        if (checkAuth()) {
            updateUserDisplay();
            addLogoutHandlers();
        }
    }
});

// Refresh session activity
function refreshSession() {
    const user = getCurrentUser();
    if (user) {
        user.lastActivity = new Date().toISOString();
        localStorage.setItem('fitcoach_user', JSON.stringify(user));
    }
}

// Refresh session on user activity
['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
    document.addEventListener(event, () => {
        refreshSession();
    }, { passive: true });
});

// Export functions for global use
window.FitCoachAuth = {
    checkAuth,
    logout,
    getCurrentUser,
    updateUserDisplay,
    refreshSession
};