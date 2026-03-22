"use server";

import { prisma } from "./prisma";
import { headers } from "next/headers";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT";
type AuditEntity = "PATIENT" | "APPOINTMENT" | "PAYMENT" | "REMINDER" | "SETTINGS" | "USER";

interface AuditParams {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams) {
  try {
    const headersList = await headers();
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? {},
        ipAddress: headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? null,
        userAgent: headersList.get("user-agent") ?? null,
      },
    });
  } catch (err) {
    // Audit failures should never break the main operation
    console.error("[Audit] Failed to create audit log:", err);
  }
}
