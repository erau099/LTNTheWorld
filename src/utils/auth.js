// Temporary Auth Utility for Demo Purposes
// Simulates a database using localStorage

const USERS_KEY = "demo_users";
const CURRENT_USER_KEY = "demo_current_user";

export const signup = (userData) => {
    // Get existing users
    const usersJson = localStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};

    // Check if user already exists
    if (users[userData.email]) {
        return { success: false, message: "User already exists" };
    }

    // Save new user
    users[userData.email] = userData;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // For demo purposes, "generate a json" log
    console.log("Account Created! Generated JSON entry:", JSON.stringify(userData, null, 2));
    
    return { success: true };
};

export const login = (email, password) => {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (!usersJson) return { success: false, message: "User not found" };

    const users = JSON.parse(usersJson);
    const user = users[email];

    if (user && user.password === password) {
        // Save as logged in
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { success: true, user };
    }

    return { success: false, message: "Invalid credentials" };
};

export const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = () => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};
