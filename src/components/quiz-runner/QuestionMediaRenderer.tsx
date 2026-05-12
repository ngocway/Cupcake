import React from 'react';
import { CustomAudioPlayer } from "@/components/common/CustomAudioPlayer";


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
        <CustomAudioPlayer 
          src={audioSrc} 
          title="Âm thanh đính kèm"
          subtitle=""
          className="max-w-xl mx-auto !bg-slate-50 border-slate-100 shadow-sm"
        />
      )}
    </div>
  );
}
