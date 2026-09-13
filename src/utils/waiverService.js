// Temporary waiver service used until the backend/database is connected.
// Later, these functions can be replaced with API calls to the Spring Boot backend.

export const WAIVER_VERSION = "1.0";

/* Creates the waiver record that will be stored with the user account */
export const createWaiverRecord = () => {
    return {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: WAIVER_VERSION
    };
};

/* Returns the waiver record from the current user object */
export const getWaiverFromUser = (user) => {
    if (!user || !user.waiver) {
        return null;
    }

    return user.waiver;
};