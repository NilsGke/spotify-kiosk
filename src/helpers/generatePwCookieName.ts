import type { User } from "@prisma/client";

export default function generatePwCookieName(
  sessionCode: string,
  adminId: User["id"],
) {
  return `password-session-${sessionCode}-adminId-${adminId}`;
}
