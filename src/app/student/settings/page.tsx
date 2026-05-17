import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsClientWrapper } from "./_components/SettingsClientWrapper"
import { getTranslations, getLocale } from "next-intl/server";

export default async function SettingsPage() {
    const t = await getTranslations("student.settings");
    const locale = await getLocale();
    const session = await auth()
    if (!session?.user) redirect("/student/login")

    return (
        <div className="max-w-5xl mx-auto py-8">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-headline">{t("title")}</h1>
                <p className="text-slate-500 mt-2">{t("subtitle")}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <SettingsClientWrapper 
                    user={session.user} 
                    translations={{
                        profile: t("profile"),
                        notifications: t("notifications"),
                        security: t("security"),
                        appearance: t("appearance")
                    }}
                />
            </div>
        </div>
    )
}
