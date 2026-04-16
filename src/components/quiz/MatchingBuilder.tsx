"use client";

import React, { useState } from 'react';
import { MatchingContent, MatchingPair } from './types';

export interface MatchingBuilderProps {
  initialData?: MatchingContent;
  onChange?: (data: MatchingContent) => void;
}

export function MatchingBuilder({ initialData, onChange }: MatchingBuilderProps) {
  const [data, setData] = useState<MatchingContent>(initialData || {
    instruction: 'Hãy nối các con vật với tên gọi tương ứng...',
    presentationType: 'IMAGE_ANSWER',
    pairs: [
      { id: '1', leftImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADGDCNUj64P5qMRvwqjGldBRpUFsqAv5LddJgKaI58dfqVg7vwUdtZRdYqci37oRiNQvzdCpmxH5Pvx-9u9QEaG_cbVSIwki7azXSZ80mGxqCCISuu2IScX9yjsjV_2LUCBIpR4AltE45SkOidFxq0u18do_NE0pT_0CJ8VNV_9U0xbqaNay9mYyDixFZS53whO_wqd0QxICtLjYgUnVaU98iA3lB1QiPo4q49mz06fN2UDX2RkOFEBBaRXZg_OgAfODGASX-ySKoE', leftText: 'Dog', rightText: 'Con chó' },
      { id: '2', leftImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuL5zVi-bejw1lA8YORomJ8CxgxB6b7INigGEYPDkCYXRd4_FRYiEE0c1GEDXx68zVQCBW72YPmk0o0RmOmcEv8PMF00L-FnR0HYyJpR9LoKnZWPUFA0jJVtORFqOtFRPbaqNgxkcw5ecNu1uClXF7Nry8rXkUqutDEZnxvaEfbiHefKS0oTwryriYCCyPkhp8kxfwbp6FHaUPKZBWqaVN4xe_KH06zOg_9Jx_osRHJFx2WkOiLScL_wLOyiiCg0F8QDCxBkVjgtOa', leftText: 'Cat', rightText: 'Con mèo' },
      { id: '3', leftImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOwFrvhF-PszowDvRdSBvcarHXe6QeQVB6EA4jbyWVirnHM3pgHCxOQYnFzrSc-vznVf-EJdIPcI8Yke0ZMTr4rbyMK4nyA2cSIgKVObd-I-QTi0BcCf2wP8Y-fEZz6SSkgSnq5xeHkx-C-4Usi0u9aKKoB251dCrjnkOulnwC8x7EXBbqFWlGb07VLazbUwEf73OE3-yIcFT85ej-V9cKScwztDxwjJpnVJ0GavKDtyMDnUEqSIlaOfwvcb-pYaaVAwimbVHX2xdl', leftText: 'Bird', rightText: 'Con chim' },
    ]
  });

  React.useEffect(() => {
    // Normalize pairs: ensure all have IDs
    if (initialData?.pairs) {
      const needsNormalization = initialData.pairs.some(p => !p.id);
      if (needsNormalization) {
        const normalizedPairs = initialData.pairs.map((p, idx) => ({
          ...p,
          id: p.id || `pair-${Date.now()}-${idx}`
        }));
        setData(prev => ({ ...prev, pairs: normalizedPairs }));
      }
    }
  }, [initialData]);

  const handleChange = (newData: Partial<MatchingContent>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (onChange) onChange(updated);
  };

  const addPair = () => {
    const newPairs = [...data.pairs, { id: Date.now().toString(), leftImageUrl: '', leftText: '', rightText: '' }];
    handleChange({ pairs: newPairs });
  };

  const removePair = (id: string) => {
    if (data.pairs.length <= 2) return;
    const newPairs = data.pairs.filter(p => p.id !== id);
    handleChange({ pairs: newPairs });
  };

  const updatePair = (id: string, field: keyof MatchingPair, value: string) => {
    const newPairs = data.pairs.map(p => p.id === id ? { ...p, [field]: value } : p);
    handleChange({ pairs: newPairs });
  };

  const handleImageUpload = (id: string, field: 'leftImageUrl' | 'rightImageUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn (tối đa 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updatePair(id, field, event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-0 flex flex-col gap-8 flex-1">
      {/* Instruction */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hướng dẫn</label>
        <input 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
          placeholder="Nhập hướng dẫn làm bài..." 
          type="text" 
          value={data.instruction}
          onChange={(e) => handleChange({ instruction: e.target.value })}
        />
        <div className="flex items-center gap-1.5 mt-1">
          <span className="material-symbols-outlined text-[18px] text-slate-400">info</span>
          <span className="text-sm text-slate-500 italic">Lưu ý: Hệ thống sẽ tự động xáo trộn vị trí các thẻ khi hiển thị cho học sinh.</span>
        </div>
      </div>

      {/* Format Toggle */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Định dạng câu hỏi:</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary/20" 
            type="radio"
            name="presentationType"
            value="IMAGE_ANSWER"
            checked={data.presentationType === 'IMAGE_ANSWER'}
            onChange={() => handleChange({ presentationType: 'IMAGE_ANSWER' })}
          />
          <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Hình ảnh - đáp án</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary/20" 
            type="radio"
            name="presentationType"
            value="QUESTION_ANSWER"
            checked={data.presentationType === 'QUESTION_ANSWER'}
            onChange={() => handleChange({ presentationType: 'QUESTION_ANSWER' })}
          />
          <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Câu hỏi - đáp án</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary/20" 
            type="radio"
            name="presentationType"
            value="IMAGE_IMAGE"
            checked={data.presentationType === 'IMAGE_IMAGE'}
            onChange={() => handleChange({ presentationType: 'IMAGE_IMAGE' })}
          />
          <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Hình ảnh - Hình ảnh</span>
        </label>
      </div>

      {/* Pairs List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center px-4">
          <div className="w-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest">Cột A</div>
          <div className="w-10"></div>
          <div className="w-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest pl-4">Cột B</div>
          <div className="w-10"></div>
        </div>
        
        <div className="flex flex-col gap-3">
          {data.pairs.map((pair) => (
            <div key={pair.id} className="flex items-center gap-4 group animate-in fade-in slide-in-from-left-2 duration-300">
              {/* Left Column (A) */}
              <div className="flex-1 flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-primary transition-all min-h-[64px]">
                {data.presentationType === 'IMAGE_ANSWER' || data.presentationType === 'IMAGE_IMAGE' ? (
                  <div className="flex items-center gap-4 w-full px-2">
                    <div className="relative group/img size-14 shrink-0 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
                      {pair.leftImageUrl ? (
                        <>
                          <img alt="Match" className="w-full h-full object-cover" src={pair.leftImageUrl} />
                          <button 
                            onClick={() => updatePair(pair.id, 'leftImageUrl', '')}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(pair.id, 'leftImageUrl', e)}
                          />
                          <span className="material-symbols-outlined text-slate-400 text-[24px]">add_a_photo</span>
                        </label>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {pair.leftImageUrl ? "Đã tải ảnh lên" : "Tải ảnh cột A"}
                    </span>
                  </div>
                ) : (
                  <input 
                    className="flex-1 border-none focus:ring-0 text-sm font-medium text-slate-700 px-3 py-2" 
                    type="text" 
                    placeholder="Nhập nội dung cột A..."
                    value={pair.leftText}
                    onChange={(e) => updatePair(pair.id, 'leftText', e.target.value)}
                  />
                )}
              </div>

              {/* Link Icon */}
              <div className="flex-shrink-0 text-slate-300">
                <span className="material-symbols-outlined">link</span>
              </div>

              {/* Right Column (B) */}
              <div className="flex-1 flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-primary transition-all min-h-[64px]">
                {data.presentationType === 'IMAGE_IMAGE' ? (
                  <div className="flex items-center gap-4 w-full px-2">
                    <div className="relative group/img size-14 shrink-0 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
                      {pair.rightImageUrl ? (
                        <>
                          <img alt="Match" className="w-full h-full object-cover" src={pair.rightImageUrl} />
                          <button 
                            onClick={() => updatePair(pair.id, 'rightImageUrl', '')}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(pair.id, 'rightImageUrl', e)}
                          />
                          <span className="material-symbols-outlined text-slate-400 text-[24px]">add_a_photo</span>
                        </label>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {pair.rightImageUrl ? "Đã tải ảnh lên" : "Tải ảnh cột B"}
                    </span>
                  </div>
                ) : (
                  <input 
                    className="flex-1 border-none focus:ring-0 text-sm font-medium text-slate-700 px-3 py-2" 
                    type="text" 
                    placeholder="Nhập nội dung cột B..."
                    value={pair.rightText || ''}
                    onChange={(e) => updatePair(pair.id, 'rightText', e.target.value)}
                  />
                )}
              </div>

              {/* Delete Button */}
              {data.pairs.length > 2 && (
                <button 
                  onClick={() => removePair(pair.id)}
                  className="flex-shrink-0 size-10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={addPair}
          className="mt-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
          <span>Thêm cặp mới</span>
        </button>
      </div>
    </div>
  );
}
