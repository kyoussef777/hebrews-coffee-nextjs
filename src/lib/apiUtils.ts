import { auth } from './auth';

/**
 * Helper to parse JSON request bodies safely.  Returns an object on success or
 * throws a response with a 400 status code on invalid JSON.
 */
export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch (err) {
    throw new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Standard error response helper.  Always returns a JSON body with success=false and the error message.
 */
export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Ensures that the current session exists and optionally that the user has the
 * ADMIN role.  Throws a Response if the user is not authenticated or not an
 * admin.  Should be called at the beginning of API handlers.
 */
export async function requireAdmin(_request?: Request) {
  const session = await auth();
  if (!session || !session.user) {
    throw errorResponse('Not authenticated', 401);
  }
  const role = (session.user as unknown as { role?: string }).role;
  if (role !== 'ADMIN') {
    throw errorResponse('Insufficient permissions', 403);
  }
  return session;
}

/**
 * Ensures that the current session exists.  Throws a 401 error if not.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session || !session.user) {
    throw errorResponse('Not authenticated', 401);
  }
  return session;
}