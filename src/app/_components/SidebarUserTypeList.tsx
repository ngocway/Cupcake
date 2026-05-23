"use client";

import { useTransition, useEffect } from "react";
import { useContentStore } from "@/store/useContentStore";
import { setUserTypePreference } from "@/actions/user-preferences-actions";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function SidebarUserTypeList({ initialUserType }: { initialUserType?: string }) {
  const t = useTranslations("home");
  const userType = useContentStore(s => s.userType);
  const setUserType = useContentStore(s => s.setUserType);
  const setFiltering = useContentStore(s => s.setFiltering);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (initialUserType && !userType) {
      setUserType(initialUserType);
    }
  }, [initialUserType, userType, setUserType]);

  const handleUserTypeChange = (typeId: string) => {
    if (userType === typeId) return;
    
    setFiltering(true);
    setUserType(typeId);
    
    // Construct new URL to trigger background prefetch in LandingPage
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("userType", typeId);
    
    startTransition(() => {
      setUserTypePreference(typeId).finally(() => {
        setFiltering(false);
      });
      // Optionally push the route if we want the URL to reflect it
      // router.push(`${pathname}?${qs.toString()}`, { scroll: false });
    });
  };

  const types = [
    { id: 'kids', label: 'Kid', src: '/images/avatars/kid.png' },
    { id: 'teens', label: 'Teen', src: '/images/avatars/teen.png' },
    { id: 'adults', label: 'Adult', src: '/images/avatars/adult.png' },
    { id: 'business', label: 'Business', src: '/images/avatars/Business man.png' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map((type) => {
        const isActive = userType === type.id;
        return (
          <button
            key={type.id}
            onClick={() => handleUserTypeChange(type.id)}
            className={`shake-on-hover w-full flex items-center gap-2 p-1.5 pr-2 rounded-2xl transition-all duration-300 ${
              isActive 
                ? "bg-primary/10 shadow-sm shadow-primary/5" 
                : "bg-transparent hover:bg-primary/5"
            }`}
          >
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
              <img src={type.src} alt={type.label} className="shake-target w-full h-full object-cover" />
            </div>
            <span className={`text-[10px] md:text-[11px] font-black uppercase transition-colors duration-300 truncate ${
              isActive ? "text-primary" : "text-slate-500"
            }`}>
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
