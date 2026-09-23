import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listTrainingVideos, listTrainingCategories } from "@/services/training/videos";
import { PageHeader } from "@/components/shared/page-header";
import { TrainingVideoTable } from "@/components/training/training-video-table";
import { AddTrainingVideoDialog } from "@/components/training/add-training-video-dialog";
import { addTrainingVideoAction, updateTrainingVideoAction, deleteTrainingVideoAction } from "./actions";

export const metadata: Metadata = { title: "Đào tạo - Học tập — VIMOVE OS" };

export default async function TrainingPage() {
  const session = await requirePermission("training.read");
  const canCreate = hasPermission(session, "training.create");
  const canUpdate = hasPermission(session, "training.update");
  const canDelete = hasPermission(session, "training.delete");
  const orgId = session.user.organizationId;

  const [videos, categories] = await Promise.all([listTrainingVideos(orgId), listTrainingCategories(orgId)]);

  return (
    <>
      <PageHeader
        title="Đào tạo - Học tập"
        description={`Danh sách video đào tạo kèm link YouTube và bài hướng dẫn trên MBS (${videos.length} video)`}
        actions={canCreate ? <AddTrainingVideoDialog action={addTrainingVideoAction} categories={categories} /> : undefined}
      />
      <TrainingVideoTable
        videos={videos}
        categories={categories}
        canUpdate={canUpdate}
        canDelete={canDelete}
        updateAction={updateTrainingVideoAction}
        deleteAction={deleteTrainingVideoAction}
      />
    </>
  );
}
