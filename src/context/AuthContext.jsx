import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
    user: null,
    setUser: () => {},
    logout: null,
    authLoading: false,
});

export const AuthProvider = ({ children }) => {
    const demoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true";
    const [user, setUser] = useState(() => {
        if (!demoMode) return null;
        try { return JSON.parse(localStorage.getItem("ltn_demo_user") || "null"); }
        catch { return null; }
    });
    const [authLoading, setAuthLoading] = useState(() => !demoMode && typeof fetch === 'function');

    useEffect(() => {
        if (!demoMode) return;
        if (user) localStorage.setItem("ltn_demo_user", JSON.stringify(user));
        else localStorage.removeItem("ltn_demo_user");
    }, [user, demoMode]);

    // Rehydrate user session from HttpOnly authToken cookie after page refresh
    useEffect(() => {
        if (demoMode || typeof fetch !== 'function') return;
        let active = true;
        fetch('/api/users/me', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && data) {
                    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
                    setUser((prev) => prev || { ...data, name: fullName || data.email });
                }
            })
            .catch(() => {})
            .finally(() => {
                if (active) setAuthLoading(false);
            });
        return () => { active = false; };
    }, [demoMode]);

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

    return (
        <AuthContext.Provider value={{ user, setUser, logout, authLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
