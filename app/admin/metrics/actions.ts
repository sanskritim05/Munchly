"use server";

import { getUserFromRequest } from "@/lib/auth-server";
import { fetchAdminMetrics, type AdminMetrics } from "@/lib/admin-metrics";

export async function loadAdminMetrics(accessToken: string): Promise<AdminMetrics | null> {
  const user = await getUserFromRequest(
    new Request("http://localhost", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user?.email !== adminEmail) {
    return null;
  }

  return fetchAdminMetrics();
}
