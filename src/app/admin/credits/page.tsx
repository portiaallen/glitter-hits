import { requireAdminSession } from "@/lib/admin";
import { CreditsClient } from "./CreditsClient";

export const metadata = { title: "Credits" };

export default async function AdminCreditsPage() {
  await requireAdminSession();
  return <CreditsClient />;
}
