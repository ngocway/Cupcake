"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { saveOnboardingConfig } from '@/actions/taxonomy-actions';
import { getAdminTags, createTag, renameTag, deleteTag, toggleTagPopularity } from '@/actions/tag-actions';

export function TaxonomySettings({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'subjects' | 'tags'>('subjects');

  // Tag form
  const [newTagName, setNewTagName] = useState('');
  
  // Goal form tracking per age group
  const [newGoalNames, setNewGoalNames] = useState<Record<string, string>>({});
  const [newLevelNames, setNewLevelNames] = useState<Record<string, string>>({});

  const PASTEL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'];
  const getRandomColor = () => PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];

  const handleAddGoal = (subjectId: string, ageGroupId: string) => {
    const key = `${subjectId}-${ageGroupId}`;
    const goalName = newGoalNames[key];
    if (!goalName || !goalName.trim()) return;
    
    setConfig((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          ageGroups: s.ageGroups.map((a: any) => {
            if (a.id !== ageGroupId) return a;
            const newGoal = { id: goalName.trim().toLowerCase().replace(/\s+/g, '-'), label: goalName.trim(), color: getRandomColor() };
            return { ...a, goals: [...(a.goals || []), newGoal] };
          })
        };
      })
    }));
    
    setNewGoalNames(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveGoal = (subjectId: string, ageGroupId: string, goalId: string) => {
    setConfig((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          ageGroups: s.ageGroups.map((a: any) => {
            if (a.id !== ageGroupId) return a;
            return { ...a, goals: (a.goals || []).filter((g: any) => g.id !== goalId) };
          })
        };
      })
    }));
  };

  const handleAddLevel = (subjectId: string, ageGroupId: string) => {
    const key = `${subjectId}-${ageGroupId}`;
    const levelName = newLevelNames[key];
    if (!levelName || !levelName.trim()) return;
    
    setConfig((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          ageGroups: s.ageGroups.map((a: any) => {
            if (a.id !== ageGroupId) return a;
            const newLevel = { id: levelName.trim().toLowerCase().replace(/\s+/g, '-'), label: levelName.trim() };
            return { ...a, levels: [...(a.levels || []), newLevel] };
          })
        };
      })
    }));
    
    setNewLevelNames(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveLevel = (subjectId: string, ageGroupId: string, levelId: string) => {
    setConfig((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          ageGroups: s.ageGroups.map((a: any) => {
            if (a.id !== ageGroupId) return a;
            return { ...a, levels: (a.levels || []).filter((l: any) => l.id !== levelId) };
          })
        };
      })
    }));
  };


  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const data = await getAdminTags();
      setTags(data);
    } catch (e) {
      toast.error('Lỗi khi tải danh sách thẻ');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await saveOnboardingConfig(config);
      toast.success('Cập nhật thiết lập môn học & độ tuổi thành công');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu thiết lập');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubjectVisibility = (subjectId: string, isVisible: boolean) => {
    // We add an isHidden property to hide subjects from users
    setConfig((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => s.id === subjectId ? { ...s, isHidden: !isVisible } : s)
    }));
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const res = await createTag(newTagName);
      if (res.success) {
        toast.success('Thêm thẻ thành công');
        setNewTagName('');
        fetchTags();
      } else {
        toast.error(res.error || 'Lỗi thêm thẻ');
      }
    } catch (e) {
      toast.error('Lỗi thêm thẻ');
    }
  };

  const handleToggleTag = async (tagName: string) => {
    try {
      await toggleTagPopularity(tagName);
      fetchTags();
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!confirm(`Xóa thẻ "${tagName}"? Thẻ này sẽ bị gỡ khỏi tất cả bài tập hiện tại.`)) return;
    try {
      const res = await deleteTag(tagName);
      if (res.success) {
        toast.success('Xóa thẻ thành công');
        fetchTags();
      } else {
        toast.error(res.error || 'Lỗi khi xóa thẻ');
      }
    } catch (e) {
      toast.error('Lỗi xóa thẻ');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'subjects' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'}`}
        >
          Môn học & Độ tuổi
        </button>
        <button 
          onClick={() => setActiveTab('tags')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'tags' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'}`}
        >
          Mục tiêu & Kỹ năng (Tags)
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Cấu hình hiển thị Môn học</h3>
              <Button onClick={handleSaveConfig} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
            <div className="grid gap-6">
              {config?.subjects?.map((subject: any) => (
                <div key={subject.id} className="p-6 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-4">
                      <img src={subject.icon} alt="" className="w-12 h-12 object-contain rounded-xl bg-neutral-100 p-2" />
                      <div>
                        <h4 className="font-bold text-xl">{subject.label} <span className="text-sm font-normal text-neutral-500">({subject.id})</span></h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-lg border">
                      <span className="text-sm font-medium">Hiển thị cho học sinh</span>
                      <Switch 
                        checked={!subject.isHidden} 
                        onCheckedChange={(checked) => toggleSubjectVisibility(subject.id, checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <h5 className="font-bold text-sm text-neutral-500 uppercase tracking-widest">Độ tuổi & Mục tiêu học tập (Learning Goals)</h5>
                    {subject.ageGroups?.map((age: any) => (
                      <div key={age.id} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border flex flex-col gap-3">
                        <div className="font-bold text-base text-primary">{age.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {(age.goals || []).map((goal: any) => (
                            <div 
                              key={goal.id} 
                              className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                              style={{ color: goal.color, border: `1.5px solid ${goal.color}40`, backgroundColor: `${goal.color}10` }}
                            >
                              {goal.label}
                              <button 
                                onClick={() => handleRemoveGoal(subject.id, age.id, goal.id)}
                                className="hover:text-red-500 opacity-70 hover:opacity-100 transition-opacity"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="Nhập mục tiêu mới (VD: Communication)..." 
                            className="max-w-[250px] h-9 text-sm"
                            value={newGoalNames[`${subject.id}-${age.id}`] || ''}
                            onChange={(e) => setNewGoalNames(prev => ({ ...prev, [`${subject.id}-${age.id}`]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(subject.id, age.id); }}
                          />
                          <Button size="sm" onClick={() => handleAddGoal(subject.id, age.id)}>Thêm Goal</Button>
                        </div>
                        
                        {/* Levels UI */}
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700/50">
                          <h6 className="font-bold text-xs text-neutral-500 uppercase tracking-widest mb-2">Cấp độ (Levels)</h6>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(age.levels || []).map((level: any) => (
                              <div 
                                key={level.id} 
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                              >
                                {level.label}
                                <button 
                                  onClick={() => handleRemoveLevel(subject.id, age.id, level.id)}
                                  className="hover:text-red-500 opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Nhập cấp độ mới (VD: Elementary A2)..." 
                              className="max-w-[250px] h-9 text-sm"
                              value={newLevelNames[`${subject.id}-${age.id}`] || ''}
                              onChange={(e) => setNewLevelNames(prev => ({ ...prev, [`${subject.id}-${age.id}`]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLevel(subject.id, age.id); }}
                            />
                            <Button size="sm" variant="outline" onClick={() => handleAddLevel(subject.id, age.id)}>Thêm Level</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-neutral-500 mt-4">Ghi chú: Việc ẩn môn học sẽ không xóa nội dung, chỉ ẩn nó khỏi danh sách tùy chọn của người dùng. Mỗi độ tuổi có mục tiêu học tập (Learning Goals) riêng biệt.</p>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold mb-4">Quản lý Từ khóa / Mục tiêu học tập</h3>
            
            <form onSubmit={handleAddTag} className="flex gap-2">
              <Input 
                value={newTagName} 
                onChange={(e) => setNewTagName(e.target.value)} 
                placeholder="Nhập tên kỹ năng mới (VD: Communication, Luyện thi IELTS...)" 
                className="max-w-md"
              />
              <Button type="submit">Thêm thẻ</Button>
            </form>

            <div className="border rounded-lg overflow-hidden mt-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  <tr>
                    <th className="p-3">Tên thẻ</th>
                    <th className="p-3">Số Bài tập</th>
                    <th className="p-3">Nổi bật (Popular)</th>
                    <th className="p-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {tags.map(tag => (
                    <tr key={tag.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-3 font-medium">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">#{tag.name}</span>
                      </td>
                      <td className="p-3 text-neutral-500">{tag.assignmentCount + tag.questionCount} mục</td>
                      <td className="p-3">
                        <Switch 
                          checked={tag.isPopular} 
                          onCheckedChange={() => handleToggleTag(tag.name)}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteTag(tag.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tags.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-500">Chưa có thẻ nào được tạo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-500">Các thẻ đánh dấu "Nổi bật" (Popular) sẽ được ưu tiên hiển thị gợi ý cho học sinh và giáo viên khi soạn bài.</p>
          </div>
        )}
      </div>
    </div>
  );
}
