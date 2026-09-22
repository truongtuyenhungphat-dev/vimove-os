"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import {
  createProductionChannel,
  updateProductionChannel,
  deleteProductionChannel,
  addProductionCreator,
  removeProductionCreator,
  setProductionEntryCount,
  createContentPiece,
  deleteContentPiece,
  moveContentPiece,
} from "@/services/production/production";
import { CONTENT_PIECE_STAGES, PRODUCTION_TASK_TYPES } from "@/lib/production/types";

const PATH = "/marketing/content-production";

const channelSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên kênh"),
  taskTypes: z.array(z.enum(PRODUCTION_TASK_TYPES)).min(1, "Chọn ít nhất 1 đầu việc"),
});

export async function createChannelAction(name: string, taskTypes: string[]) {
  const session = await assertPermission("production.create");
  const parsed = channelSchema.parse({ name, taskTypes });
  await createProductionChannel(session.user.organizationId, session.user.id, parsed);
  revalidatePath(PATH);
}

export async function updateChannelAction(id: string, name: string, taskTypes: string[]) {
  const session = await assertPermission("production.update");
  const parsed = channelSchema.parse({ name, taskTypes });
  await updateProductionChannel(session.user.organizationId, session.user.id, id, parsed);
  revalidatePath(PATH);
}

export async function deleteChannelAction(id: string) {
  const session = await assertPermission("production.delete");
  await deleteProductionChannel(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}

export async function addCreatorAction(userId: string) {
  const session = await assertPermission("production.create");
  await addProductionCreator(session.user.organizationId, session.user.id, userId);
  revalidatePath(PATH);
}

export async function removeCreatorAction(id: string) {
  const session = await assertPermission("production.delete");
  await removeProductionCreator(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  userId: z.string().min(1),
  channelId: z.string().min(1),
  taskType: z.enum(PRODUCTION_TASK_TYPES),
  value: z.number().int().min(0),
});

export async function updateEntryCountAction(date: string, userId: string, channelId: string, taskType: string, value: number) {
  const session = await assertPermission("production.update");
  const parsed = entrySchema.parse({ date, userId, channelId, taskType, value });
  await setProductionEntryCount(session.user.organizationId, parsed);
  revalidatePath(PATH);
}

const pieceSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tên nội dung"),
  channelId: z.string().trim().optional(),
  assigneeId: z.string().trim().optional(),
});

export async function createPieceAction(formData: FormData) {
  const session = await assertPermission("production.create");
  const parsed = pieceSchema.parse({
    title: formData.get("title"),
    channelId: formData.get("channelId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  });
  await createContentPiece(session.user.organizationId, session.user.id, {
    title: parsed.title,
    channelId: parsed.channelId || null,
    assigneeId: parsed.assigneeId || null,
  });
  revalidatePath(PATH);
}

export async function deletePieceAction(id: string) {
  const session = await assertPermission("production.delete");
  await deleteContentPiece(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}

const stageSchema = z.enum(CONTENT_PIECE_STAGES as [string, ...string[]]);

export async function movePieceAction(pieceId: string, stage: string, targetIndex: number) {
  const session = await assertPermission("production.update");
  const parsedStage = stageSchema.parse(stage);
  await moveContentPiece(session.user.organizationId, session.user.id, pieceId, { stage: parsedStage as never, targetIndex });
  revalidatePath(PATH);
}
