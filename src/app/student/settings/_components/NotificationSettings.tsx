"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Clock, GraduationCap, Mail, Smartphone } from "lucide-react"
import { updateNotificationSettings } from "@/actions/student-settings-actions"

export function NotificationSettings() {
    const [settings, setSettings] = useState({
        newAssignment: true,
        deadlineReminder: true,
        graded: true,
        emailNotify: false,
        pushNotify: true
    })
    const [loading, setLoading] = useState(false)

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = async () => {
        setLoading(true)
        await updateNotificationSettings(settings)
        setLoading(false)
        alert("Notification settings saved!")
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6">
                <div className="flex items-center justify-between p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl group hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-700 shadow-sm rounded-2xl text-primary group-hover:scale-110 transition-transform">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-900 dark:text-white">New Assignments</Label>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Notify when teacher assigns new tasks</p>
                        </div>
                    </div>
                    <Switch 
                        checked={settings.newAssignment} 
                        onCheckedChange={() => handleToggle("newAssignment")}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl group hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-700 shadow-sm rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-900 dark:text-white">Deadline Reminders</Label>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Receive alerts when assignments are nearing deadline</p>
                        </div>
                    </div>
                    <Switch 
                        checked={settings.deadlineReminder} 
                        onCheckedChange={() => handleToggle("deadlineReminder")}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl group hover:border-green-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-700 shadow-sm rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-900 dark:text-white">Results & Feedbacks</Label>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Notify when there are grades or advice from teacher</p>
                        </div>
                    </div>
                    <Switch 
                        checked={settings.graded} 
                        onCheckedChange={() => handleToggle("graded")}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Notification Channels</h4>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Push Notifications (Browser)</span>
                        </div>
                        <Switch 
                            checked={settings.pushNotify} 
                            onCheckedChange={() => handleToggle("pushNotify")}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Email (Weekly)</span>
                        </div>
                        <Switch 
                            checked={settings.emailNotify} 
                            onCheckedChange={() => handleToggle("emailNotify")}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary text-white rounded-full px-10 h-10 text-xs font-bold uppercase tracking-widest"
                >
                    {loading ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    )
}
