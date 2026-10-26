// Use this instead of fetch() for protected endpoints.
// The browser automatically sends the HttpOnly authentication cookie.

export async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers
        }
    })

    // 401 = missing, expired, or invalid authentication cookie
    if (response.status === 401) {
        window.location.hash = '#/Login'
        window.location.reload()
    }

    return response
}