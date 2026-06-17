import React from 'react';

interface TaxonomySelectorProps {
  config: any;
  subject: string;
  setSubject: (subject: string) => void;
  targetAudiences: string[];
  setTargetAudiences: (audiences: string[]) => void;
  audienceLevels: Record<string, string>;
  setAudienceLevels: (levels: Record<string, string>) => void;
  learningGoals: string[];
  setLearningGoals: (goals: string[]) => void;
}

export function TaxonomySelector({
  config,
  subject,
  setSubject,
  targetAudiences,
  setTargetAudiences,
  audienceLevels,
  setAudienceLevels,
  learningGoals,
  setLearningGoals
}: TaxonomySelectorProps) {
  const currentSubjectConfig = config?.subjects?.find((s: any) => s.id === subject);

  return (
    <>
      {/* Subject */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Môn học (Subject)</label>
        <div className="flex flex-wrap gap-2">
          {config?.subjects?.filter((s:any) => !s.isHidden).map((s: any) => (
            <button
              key={s.id}
              onClick={() => {
                setSubject(s.id);
                setTargetAudiences([]);
                setAudienceLevels({});
                setLearningGoals([]);
              }}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                subject === s.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Audiences */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Độ tuổi (Target Audiences)</label>
        <div className="flex flex-wrap gap-2">
          {currentSubjectConfig?.ageGroups?.filter((a:any) => a.id !== 'kindergarten').map((type: any) => {
            const isSelected = targetAudiences.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => {
                  if (isSelected) {
                    setTargetAudiences(targetAudiences.filter(id => id !== type.id));
                    const nextLevels = { ...audienceLevels };
                    delete nextLevels[type.id];
                    setAudienceLevels(nextLevels);
                    
                    const ageGroupGoals = type.goals?.map((g: any) => g.id) || [];
                    setLearningGoals(learningGoals.filter(gid => !ageGroupGoals.includes(gid)));
                  } else {
                    setTargetAudiences([...targetAudiences, type.id]);
                  }
                }}
                className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            );
          })}
          {(!currentSubjectConfig?.ageGroups || currentSubjectConfig.ageGroups.length === 0) && (
            <p className="text-xs text-slate-400 italic">Vui lòng chọn môn học để xem các độ tuổi phù hợp.</p>
          )}
        </div>
        <p className="text-xs text-slate-400 px-1 italic">
          * Chọn các độ tuổi phù hợp. Với mỗi độ tuổi được chọn, bạn sẽ thiết lập cấp độ và mục tiêu học tập riêng bên dưới.
        </p>
      </div>

      {/* Levels for each target audience */}
      {targetAudiences.map(audId => {
        const ageGroup = currentSubjectConfig?.ageGroups?.find((a: any) => a.id === audId);
        if (!ageGroup || !ageGroup.levels || ageGroup.levels.length === 0) return null;
        const selectedLevel = audienceLevels[audId] || '';

        return (
          <div key={`levels-${audId}`} className="space-y-3 p-4 border rounded-xl bg-slate-50/50 dark:bg-gray-900/20">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Cấp độ cho {ageGroup.label} (Levels)
            </label>
            <div className="flex flex-wrap gap-2">
              {ageGroup.levels.map((lvl: any) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    setAudienceLevels({
                      ...audienceLevels,
                      [audId]: selectedLevel === lvl.id ? '' : lvl.id
                    });
                  }}
                  className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    selectedLevel === lvl.id 
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-105' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Learning Goals for each target audience */}
      {targetAudiences.map(audId => {
        const ageGroup = currentSubjectConfig?.ageGroups?.find((a: any) => a.id === audId);
        if (!ageGroup || !ageGroup.goals || ageGroup.goals.length === 0) return null;

        return (
          <div key={`goals-${audId}`} className="space-y-4 border p-4 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Mục tiêu học tập cho {ageGroup.label} (Learning Goals)
            </label>
            <div className="flex flex-wrap gap-2">
              {ageGroup.goals.map((goal: any) => {
                const isSelected = learningGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => {
                      if (isSelected) {
                        setLearningGoals(learningGoals.filter(g => g !== goal.id));
                      } else {
                        setLearningGoals([...learningGoals, goal.id]);
                      }
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold transition-all border-2"
                    style={{ 
                      color: isSelected ? '#fff' : goal.color, 
                      backgroundColor: isSelected ? goal.color : 'transparent',
                      borderColor: goal.color
                    }}
                  >
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
