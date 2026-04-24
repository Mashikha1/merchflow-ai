export const ROLE_RANK = {
  VIEWER: 0,
  DESIGNER: 1,
  SALES: 2,
  MERCHANDISER: 3,
  ADMIN: 4,
}

export function hasMinRole(userRole, minRole) {
  if (!minRole) return true
  const a = ROLE_RANK[userRole?.toUpperCase()] ?? ROLE_RANK[userRole] ?? 0
  const b = ROLE_RANK[minRole?.toUpperCase()] ?? ROLE_RANK[minRole] ?? 0
  return a >= b
}

