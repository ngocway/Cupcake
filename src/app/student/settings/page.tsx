import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsClientWrapper } from "./_components/SettingsClientWrapper"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    return (
        <div className="max-w-5xl mx-auto py-8">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-headline">Thiết lập tài khoản</h1>
                <p className="text-slate-500 mt-2">Quản lý hồ sơ, bảo mật và cấu hình trải nghiệm học tập của bạn.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <SettingsClientWrapper user={session.user} />
            </div>
        </div>
    )
}
