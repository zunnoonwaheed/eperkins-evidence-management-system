/**
 * Authentication Service
 *
 * This service will handle:
 * - User authentication (login/logout)
 * - Session management
 * - Role-based access control (admin vs. public)
 * - Password hashing and verification
 *
 * TODO: Implement when authentication strategy is defined
 * Consider: NextAuth.js, Supabase Auth, or custom JWT implementation
 */

/**
 * User type definition
 * TODO: Move to types/index.ts when implementing
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

/**
 * Session type definition
 * TODO: Move to types/index.ts when implementing
 */
export interface Session {
  user: User;
  accessToken: string;
  expiresAt: string;
}

/**
 * Authenticate user with email and password
 * TODO: Implement with Supabase Auth or NextAuth
 */
export async function signIn(email: string, password: string): Promise<Session> {
  throw new Error('Not implemented: signIn - requires authentication provider');
}

/**
 * Sign out user
 * TODO: Implement session invalidation
 */
export async function signOut(): Promise<void> {
  throw new Error('Not implemented: signOut - requires authentication provider');
}

/**
 * Get current user session
 * TODO: Implement session retrieval
 */
export async function getSession(): Promise<Session | null> {
  throw new Error('Not implemented: getSession - requires authentication provider');
}

/**
 * Check if user is authenticated
 * TODO: Implement authentication check
 */
export async function isAuthenticated(): Promise<boolean> {
  throw new Error('Not implemented: isAuthenticated - requires authentication provider');
}

/**
 * Check if user is admin
 * TODO: Implement role check
 */
export async function isAdmin(): Promise<boolean> {
  throw new Error('Not implemented: isAdmin - requires authentication provider');
}

/**
 * Refresh access token
 * TODO: Implement token refresh logic
 */
export async function refreshToken(): Promise<string> {
  throw new Error('Not implemented: refreshToken - requires authentication provider');
}
