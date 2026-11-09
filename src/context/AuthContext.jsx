import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const demoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true";
    const [user, setUser] = useState(() => {
        if (!demoMode) return null;
        try { return JSON.parse(localStorage.getItem("ltn_demo_user") || "null"); }
        catch { return null; }
    });

    useEffect(() => {
        if (!demoMode) return;
        if (user) localStorage.setItem("ltn_demo_user", JSON.stringify(user));
        else localStorage.removeItem("ltn_demo_user");
    }, [user, demoMode]);

    const logout = async () => {
        if (demoMode) {
            setUser(null);
            localStorage.removeItem("ltn_demo_user");
            return;
        }
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }

        setUser(null);
    };

    // Volatility: Refreshing the page clears the state because it's only in memory (useState)

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
