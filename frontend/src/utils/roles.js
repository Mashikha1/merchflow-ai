export const ROLE_RANK = {
  Viewer: 0,
  Designer: 1,
  Sales: 2,
  Merchandiser: 3,
  Admin: 4,
}

export function hasMinRole(userRole, minRole) {
  if (!minRole) return true
  const a = ROLE_RANK[userRole] ?? 0
  const b = ROLE_RANK[minRole] ?? 0
  return a >= b
}

