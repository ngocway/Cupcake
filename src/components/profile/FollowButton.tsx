"use client"

import { useState } from "react"
import { toggleFollowTeacher } from "@/actions/teacher-profile"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"

interface FollowButtonProps {
    teacherId: string
    initialIsFollowing: boolean
    isLoggedIn: boolean
}

export function FollowButton({ teacherId, initialIsFollowing, isLoggedIn }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        if (!isLoggedIn) {
            alert("Vui lòng đăng nhập để theo dõi giáo viên.");
            return;
        }

        setLoading(true);
        try {
            const res = await toggleFollowTeacher(teacherId);
            if (res.success) {
                setIsFollowing(res.action === "followed");
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isFollowing 
                ? "bg-slate-100 text-slate-500 border border-slate-200" 
                : "bg-primary text-white shadow-primary/20 hover:scale-105"
            }`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4" /> Đang theo dõi
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" /> Theo dõi giáo viên
                </>
            )}
        </button>
    );
}
