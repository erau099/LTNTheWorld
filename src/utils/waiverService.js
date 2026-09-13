// Waiver service for handling waiver acceptance data on the frontend.
//
// createWaiverRecord():
// - Marks the waiver as accepted
// - Records the exact acceptance date/time
// - Stores the current waiver version
//
// getWaiverFromUser():
// - Checks whether a user object has waiver data
// - Returns the stored waiver record if one exists
//
// For now, this works with the temporary frontend/localStorage setup.
// Later, these functions can be updated to send or retrieve waiver data
// through the Spring Boot API once PostgreSQL is connected.

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