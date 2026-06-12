import React from 'react';

interface TaxonomySelectorProps {
  config: any;
  subject: string;
  setSubject: (subject: string) => void;
  targetAudiences: string[];
  setTargetAudiences: (audiences: string[]) => void;
  level: string;
  setLevel: (level: string) => void;
  learningGoals: string[];
  setLearningGoals: (goals: string[]) => void;
}

export function TaxonomySelector({
  config,
  subject,
  setSubject,
  targetAudiences,
  setTargetAudiences,
  level,
  setLevel,
  learningGoals,
  setLearningGoals
}: TaxonomySelectorProps) {
  return (
    <>
      {/* Subject */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Môn học (Subject)</label>
        <div className="flex flex-wrap gap-2">
          {config?.subjects?.filter((s:any) => !s.isHidden).map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
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
          {config?.subjects?.find((s:any) => s.id === subject)?.ageGroups?.filter((a:any) => a.id !== 'kindergarten').map((type: any) => (
            <button
              key={type.id}
              onClick={() => {
                if (targetAudiences.includes(type.id)) {
                  setTargetAudiences([]);
                  setLearningGoals([]);
                  setLevel('');
                } else {
                  setTargetAudiences([type.id]);
                  setLearningGoals([]);
                  setLevel('');
                }
              }}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                targetAudiences.includes(type.id) 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
          {(!config?.subjects?.find((s:any) => s.id === subject)?.ageGroups || config.subjects.find((s:any) => s.id === subject).ageGroups.length === 0) && (
            <p className="text-xs text-slate-400 italic">Vui lòng chọn môn học để xem các độ tuổi phù hợp.</p>
          )}
        </div>
        <p className="text-xs text-slate-400 px-1 italic">
          * Mỗi bài tập chỉ thuộc 1 độ tuổi duy nhất để đảm bảo Mục tiêu học tập chính xác.
        </p>
      </div>

      {/* Levels */}
      {targetAudiences.length > 0 && config?.subjects?.find((s:any) => s.id === subject)?.ageGroups?.find((a:any) => a.id === targetAudiences[0])?.levels?.length > 0 && (
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cấp độ (Levels)</label>
          <div className="flex flex-wrap gap-2">
            {config?.subjects?.find((s:any) => s.id === subject)?.ageGroups?.find((a:any) => a.id === targetAudiences[0])?.levels?.map((lvl: any) => (
              <button
                key={lvl.id}
                onClick={() => setLevel(level === lvl.id ? '' : lvl.id)}
                className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  level === lvl.id 
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-105' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Learning Goals */}
      {targetAudiences.length > 0 && (
        <div className="space-y-4 border p-4 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mục tiêu học tập (Learning Goals)</label>
          <div className="flex flex-wrap gap-2">
            {config?.subjects?.find((s:any) => s.id === subject)?.ageGroups?.find((a:any) => a.id === targetAudiences[0])?.goals?.map((goal: any) => (
              <button
                key={goal.id}
                onClick={() => {
                  if (learningGoals.includes(goal.id)) {
                    setLearningGoals(learningGoals.filter(g => g !== goal.id));
                  } else {
                    setLearningGoals([...learningGoals, goal.id]);
                  }
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2`}
                style={{ 
                  color: learningGoals.includes(goal.id) ? '#fff' : goal.color, 
                  backgroundColor: learningGoals.includes(goal.id) ? goal.color : 'transparent',
                  borderColor: goal.color
                }}
              >
                {goal.label}
              </button>
            ))}
            {(!config?.subjects?.find((s:any) => s.id === subject)?.ageGroups?.find((a:any) => a.id === targetAudiences[0])?.goals || config.subjects.find((s:any) => s.id === subject).ageGroups.find((a:any) => a.id === targetAudiences[0]).goals.length === 0) && (
              <p className="text-xs text-slate-400 italic">Độ tuổi này chưa có Mục tiêu học tập nào được thiết lập trong cài đặt Admin.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
