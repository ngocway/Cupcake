import React from 'react';

export function QuestionMediaRenderer({ question }: { question: any }) {
  if (!question) return null;
  
  const videoSrc = question.videoUrl || (question.mediaType === 'VIDEO' ? question.mediaUrl : null);
  const audioSrc = question.audioUrl || (question.mediaType === 'AUDIO' ? question.mediaUrl : null);
  const imageSrc = question.imageUrl || (question.mediaType === 'IMAGE' ? question.mediaUrl : null);

  if (!videoSrc && !audioSrc && !imageSrc) return null;

  return (
    <div className="my-6 flex flex-col items-center gap-6 w-full animate-in fade-in slide-in-from-top-2 duration-700">
      {imageSrc && (
        <div className="w-full relative group">
          <img 
            src={imageSrc} 
            alt="Question Image" 
            className="w-full max-h-[50vh] object-contain mx-auto rounded-3xl bg-slate-50 border border-slate-100 shadow-xl"
          />
        </div>
      )}
      
      {videoSrc && (
        <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video max-h-[50vh] flex items-center justify-center">
          <video 
            controls 
            preload="metadata"
            src={videoSrc} 
            className="w-full h-full max-h-[50vh] outline-none"
          />
        </div>
      )}
      
      {audioSrc && (
        <div className="w-full max-w-xl mx-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
             <span className="material-symbols-outlined text-[18px]">volume_up</span>
             Âm thanh đính kèm
          </div>
          <audio 
            controls 
            src={audioSrc} 
            className="w-full h-10 outline-none"
          />
        </div>
      )}
    </div>
  );
}
