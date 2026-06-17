/**
 * Shared auth session helpers.
 * Use these utilities to read the currently authenticated user/role
 * consistently across all components — never read localStorage directly.
 */

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentRole(): string {
  return localStorage.getItem("userRole") || "Production Manager";
}
