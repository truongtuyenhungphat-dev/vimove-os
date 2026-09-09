import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { getOrganization } from "@/services/core/organization";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Cài đặt tổ chức — VIMOVE OS" };

export default async function SettingsPage() {
  const session = await requirePermission("organization.manage");
  const organization = await getOrganization(session.user.organizationId);

  return (
    <>
      <PageHeader title="Cài đặt tổ chức" description="Thông tin chung của tổ chức" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm name={organization.name} />
        </CardContent>
      </Card>
    </>
  );
}
