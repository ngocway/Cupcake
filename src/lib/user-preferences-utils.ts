export function getNormalizedUserType(ageGroupId: string): string {
  const id = (ageGroupId || "").toLowerCase();
  if (id === "kindergarten" || id === "kindergarden" || id === "kids-2-5" || id.includes("kindergarten")) {
    return "kindergarten";
  }
  if (id === "kid" || id === "kids" || id.startsWith("grade")) {
    return "kid";
  }
  if (id === "teen" || id === "teens" || id === "primary") {
    return "teen";
  }
  return "learner";
}

export function getBestAgeGroupForSubject(subjectId: string, currentUserType: string, currentAgeGroup: string, config: any): string {
  const subject = config?.subjects?.find((s: any) => s.id === subjectId);
  if (!subject || !subject.ageGroups || subject.ageGroups.length === 0) return "";

  // 0. If user has never picked an age group, preserve that — don't auto-assign a default.
  //    This allows the onboarding popup to trigger on first visit.
  if (!currentAgeGroup || currentAgeGroup.trim() === "") return "";

  // 1. If current age group is already valid for this subject, keep it
  if (subject.ageGroups.some((a: any) => a.id === currentAgeGroup)) {
    return currentAgeGroup;
  }

  // 2. Try to find an age group in the new subject that maps to the same userType
  const sameTypeGroup = subject.ageGroups.find((a: any) => getNormalizedUserType(a.id) === currentUserType);
  if (sameTypeGroup) {
    return sameTypeGroup.id;
  }

  // 3. Fallback to the first age group of this subject (only when switching subjects)
  return subject.ageGroups[0].id;
}
