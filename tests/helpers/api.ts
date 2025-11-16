/**
 * Helper to make API requests during tests
 */
export async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: response.headers,
  };
}

/**
 * Helper to make authenticated API requests
 */
export async function authenticatedRequest(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  return apiRequest(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Helper to get auth token for a user
 */
export async function getAuthToken(email: string, password: string) {
  const { data } = await apiRequest('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return data?.access_token;
}
