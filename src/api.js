// Use this instead of fetch() for any call to a protected endpoint.
// It attaches the JWT and handles an invalid or expired token.
export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token')

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    })

    // 401 = missing, expired, or tampered token
    if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.hash = '#/Login'   // HashRouter, so set the hash instead of the path
        window.location.reload()           // wipes the in-memory user state too
    }

    return response
}