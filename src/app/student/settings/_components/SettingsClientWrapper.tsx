"use client"

import { useState } from "react"
import { User, Shield, Bell, Palette } from "lucide-react"
import { ProfileSettings } from "./ProfileSettings"
import { SecuritySettings } from "./SecuritySettings"
import { NotificationSettings } from "./NotificationSettings"
import { AppearanceSettings } from "./AppearanceSettings"

export function SettingsClientWrapper({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState("profile")

    const tabs = [
        { id: "profile", label: "Hồ sơ", icon: User, color: "text-blue-500" },
        { id: "notifications", label: "Thông báo", icon: Bell, color: "text-orange-500" },
        { id: "security", label: "Bảo mật", icon: Shield, color: "text-red-500" },
        { id: "appearance", label: "Giao diện", icon: Palette, color: "text-purple-500" },
    ]

    return (
        <>
            <aside className="lg:col-span-1 space-y-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                            activeTab === tab.id 
                            ? "bg-white shadow-md shadow-slate-200/50 text-slate-900 font-bold" 
                            : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : "text-slate-400"}`} />
                        <span className="text-sm">{tab.label}</span>
                    </button>
                ))}
            </aside>

            <main className="lg:col-span-3 bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 min-h-[600px]">
                {activeTab === "profile" && <ProfileSettings user={user} />}
                {activeTab === "notifications" && <NotificationSettings />}
                {activeTab === "security" && <SecuritySettings user={user} />}
                {activeTab === "appearance" && <AppearanceSettings />}
            </main>
        </>
    )
}
