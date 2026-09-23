"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createTrainingVideo, updateTrainingVideo, deleteTrainingVideo } from "@/services/training/videos";

const PATH = "/marketing/training";

const videoSchema = z.object({
  category: z.string().trim().min(1, "Cần chọn danh mục"),
  title: z.string().trim().min(1, "Cần nhập tên video"),
  publishedDate: z.string().trim().optional(),
  youtubeUrl: z.string().trim().min(1, "Cần nhập link YouTube"),
  mbsUrl: z.string().trim().optional(),
});

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addTrainingVideoAction(formData: FormData) {
  const session = await assertPermission("training.create");
  const parsed = videoSchema.parse({
    category: formData.get("category"),
    title: formData.get("title"),
    publishedDate: formData.get("publishedDate") || undefined,
    youtubeUrl: formData.get("youtubeUrl"),
    mbsUrl: formData.get("mbsUrl") || undefined,
  });
  await createTrainingVideo(session.user.organizationId, session.user.id, {
    category: parsed.category,
    title: parsed.title,
    publishedDate: toDate(parsed.publishedDate),
    youtubeUrl: parsed.youtubeUrl,
    mbsUrl: parsed.mbsUrl,
  });
  revalidatePath(PATH);
}

export async function updateTrainingVideoAction(id: string, data: { category: string; title: string; publishedDate?: string; youtubeUrl: string; mbsUrl?: string }) {
  const session = await assertPermission("training.update");
  const parsed = videoSchema.parse(data);
  await updateTrainingVideo(session.user.organizationId, session.user.id, id, {
    category: parsed.category,
    title: parsed.title,
    publishedDate: toDate(parsed.publishedDate),
    youtubeUrl: parsed.youtubeUrl,
    mbsUrl: parsed.mbsUrl,
  });
  revalidatePath(PATH);
}

export async function deleteTrainingVideoAction(id: string) {
  const session = await assertPermission("training.delete");
  await deleteTrainingVideo(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}
