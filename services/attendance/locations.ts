import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";

export async function listLocations(organizationId: string) {
  return prisma.attendanceLocation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLocation(organizationId: string, id: string) {
  return prisma.attendanceLocation.findFirst({ where: { id, organizationId } });
}

export async function createLocation(
  organizationId: string,
  actorId: string,
  data: { name: string; latitude: number; longitude: number; radiusMeters: number }
) {
  const location = await prisma.attendanceLocation.create({
    data: { organizationId, createdById: actorId, ...data },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "attendance_location.create",
    entityType: "AttendanceLocation",
    entityId: location.id,
    after: data,
  });
  return location;
}

export async function updateLocation(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; latitude: number; longitude: number; radiusMeters: number }
) {
  const before = await prisma.attendanceLocation.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy địa điểm");
  const updated = await prisma.attendanceLocation.update({ where: { id }, data });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "attendance_location.update",
    entityType: "AttendanceLocation",
    entityId: id,
    before: { name: before.name, latitude: before.latitude, longitude: before.longitude, radiusMeters: before.radiusMeters },
    after: data,
  });
  return updated;
}

export async function deleteLocation(organizationId: string, actorId: string, id: string) {
  const before = await prisma.attendanceLocation.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy địa điểm");
  await prisma.attendanceLocation.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "attendance_location.delete", entityType: "AttendanceLocation", entityId: id, before: { name: before.name } });
}
