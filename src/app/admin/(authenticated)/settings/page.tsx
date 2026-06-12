import { getOnboardingConfig } from "@/actions/user-preferences-actions";
import { TaxonomySettings } from "./TaxonomySettings";

export default async function AdminSettingsPage() {
  const initialConfig = await getOnboardingConfig();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Cài đặt Hệ thống</h1>
        <p className="text-neutral-500">Quản lý môn học, độ tuổi và các mục tiêu học tập (Tags) của nền tảng.</p>
      </div>
      
      <TaxonomySettings initialConfig={initialConfig} />
    </div>
  )
}
