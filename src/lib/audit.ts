import { db } from "./db";

export async function audit(userId: string | null | undefined, action: string, entity: string, entityId?: string, details?: unknown) {
  await db.auditLog.create({ data: { userId: userId ?? null, action, entity, entityId, details: details === undefined ? undefined : JSON.stringify(details) } });
}
