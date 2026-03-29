import React from 'react';

export function QuestionMediaRenderer({ question }: { question: any }) {
  if (!question) return null;
  const hasImage = !!question.imageUrl || (question.mediaType === 'IMAGE' && !!question.mediaUrl);
  const hasAudio = !!question.audioUrl || (question.mediaType === 'AUDIO' && !!question.mediaUrl);
  const hasVideo = question.mediaType === 'VIDEO' && !!question.mediaUrl;

  if (!hasImage && !hasAudio && !hasVideo) return null;

  return (
    <div className="my-6 flex flex-col items-center gap-6 w-full">
      {hasImage && (
        <img 
          src={question.imageUrl || question.mediaUrl} 
          alt="Question Media" 
          className="w-full max-h-[40vh] object-contain mx-auto rounded-xl bg-slate-50 border border-slate-100 shadow-sm"
        />
      )}
      
      {hasVideo && (
        <video 
          controls 
          preload="metadata"
          src={question.videoUrl || (question.mediaType === 'VIDEO' ? question.mediaUrl : undefined)} 
          className="w-full max-h-[40vh] mx-auto rounded-xl bg-black shadow-md outline-none"
        />
      )}
      
      {hasAudio && (
        <audio 
          controls 
          src={question.audioUrl || question.mediaUrl} 
          className="w-full max-w-md mx-auto outline-none"
        />
      )}
    </div>
  );
}
