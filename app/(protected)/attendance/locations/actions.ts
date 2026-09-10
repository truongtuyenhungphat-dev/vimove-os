"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createLocation, updateLocation, deleteLocation } from "@/services/attendance/locations";
import { generateQrToken } from "@/services/attendance/qr";

export async function createLocationAction(formData: FormData) {
  const session = await assertPermission("attendance.manage");
  await createLocation(session.user.organizationId, session.user.id, {
    name: String(formData.get("name")),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    radiusMeters: Number(formData.get("radiusMeters")),
  });
  revalidatePath("/attendance/locations");
}

export async function updateLocationAction(id: string, formData: FormData) {
  const session = await assertPermission("attendance.manage");
  await updateLocation(session.user.organizationId, session.user.id, id, {
    name: String(formData.get("name")),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    radiusMeters: Number(formData.get("radiusMeters")),
  });
  revalidatePath("/attendance/locations");
}

export async function deleteLocationAction(id: string) {
  const session = await assertPermission("attendance.manage");
  await deleteLocation(session.user.organizationId, session.user.id, id);
  revalidatePath("/attendance/locations");
}

export async function generateQrTokenAction(locationId: string) {
  const session = await assertPermission("attendance.manage");
  const { token, expiresAt, locationName } = await generateQrToken(session.user.organizationId, locationId);
  return { token, expiresAt: expiresAt.toISOString(), locationName };
}
