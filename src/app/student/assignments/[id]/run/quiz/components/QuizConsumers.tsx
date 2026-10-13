"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Info, User } from "lucide-react";
import { ExplanationBlock } from "@/components/common/ExplanationBlock";
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import { TeacherAvatar } from "@/components/shared/TeacherAvatar";
import { GlobalAudioPlayer } from "@/components/common/GlobalAudioPlayer";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";
import { InstructionsBlock } from "@/components/common/InstructionsBlock";
import { RelatedAssignmentsSection } from "@/app/student/_components/RelatedAssignmentsSection";
import { getYoutubeVideoId } from "../utils/quizHelpers";

export function ExplanationResolver({
  promise,
  questionId,
  explanation,
  isExpanded,
  onToggleExpand,
  hideHeader,
}: {
  promise: Promise<Record<string, any>> | undefined;
  questionId: string;
  explanation: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  hideHeader?: boolean;
}) {
  const translationMap = promise ? React.use(promise) : null;
  const translations = translationMap?.[questionId] ?? null;
  return (
    <ExplanationBlock
      questionId={questionId}
      explanation={explanation}
      explanationTranslations={translations}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      hideHeader={hideHeader}
    />
  );
}

export function GlobalTeacherInfoConsumer({ promise, handleSafeNavigate }: any) {
  const extraData = React.use(promise) as any;
  if (!extraData || !extraData.teacher) return null;
  return <FloatingTeacherInfo teacher={extraData.teacher} onNavigate={handleSafeNavigate} />;
}

export function StartScreenTeacherAvatar({ promise }: { promise: Promise<any> }) {
  const extraData = React.use(promise) as any;
  if (!extraData || !extraData.teacher) return null;
  const teacher = extraData.teacher;
  if (!teacher.isPortfolioPublished) return null;

  return (
    <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white shrink-0">
      <TeacherAvatar
        src={teacher.image}
        name={teacher.name}
        className="w-full h-full object-cover"
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
            <User className="w-8 h-8" />
          </div>
        }
      />
    </div>
  );
}

export function ExtraDataConsumer({ promise, translationsPromise, isGuest, t }: any) {
  const extraData = React.use(promise) as any;
  const instructionsTranslations = translationsPromise ? (React.use(translationsPromise) as any) : null;
  if (!extraData) return null;

  const videoUrl = extraData.lesson?.videoUrl || extraData.videoUrl;
  const audioUrl = extraData.lesson?.audioUrl || extraData.audioUrl;
  const youtubeId = getYoutubeVideoId(videoUrl);

  const hasMaterialSection = videoUrl || audioUrl || extraData.readingText;
  const hasInstructionText = !!extraData.instructions || !!extraData.instructionsImageUrl;

  return (
    <>
      {hasMaterialSection && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            {t("studyMaterial")}
          </div>
          <div className="space-y-6">
            {videoUrl && (
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                {youtubeId ? (
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}?rel=0`} title="Video" allowFullScreen />
                ) : (
                  <video src={videoUrl} className="w-full h-full" controls />
                )}
              </div>
            )}
            {audioUrl && (
              <GlobalAudioPlayer audioUrl={audioUrl} autoPlay={false} defaultPlaybackRate={extraData.ttsSpeed || 1.0} />
            )}
            <div className="prose prose-slate prose-lg max-w-none text-slate-700 text-lg leading-loose">
              <InteractiveReadingContent html={extraData.readingText} isLoggedIn={!isGuest} playbackRate={extraData.ttsSpeed || 1.0} />
            </div>
          </div>
        </div>
      )}

      {hasInstructionText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
            <Info className="w-4 h-4" />
            {t("instructions")}
          </div>
          <InstructionsBlock
            instructions={extraData.instructions}
            instructionsTranslations={instructionsTranslations}
            instructionsImageUrl={extraData.instructionsImageUrl}
            isLoggedIn={!isGuest}
            proseClassName="prose prose-slate max-w-none bg-secondary/5 p-4 rounded-2xl border border-secondary/10"
          />
        </div>
      )}

      {extraData.tags && (
        <div className="flex flex-wrap gap-2">
          {extraData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Link key={i} href={`/tags/${encodeURIComponent(tag)}`} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-all">
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function RelatedAssignmentsConsumer({ promise, isGuest, onNavigate }: { promise: Promise<any[]>; isGuest: boolean; onNavigate: (url: string) => void }) {
  const relatedAssignments = React.use(promise);
  if (!relatedAssignments || relatedAssignments.length === 0) return null;
  return (
    <div className="mt-8 w-full bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-xl">
      <RelatedAssignmentsSection 
        items={relatedAssignments.map((a: any) => ({ ...a, type: a.type || ("ASSIGNMENT" as const) }))} 
        isGuest={isGuest}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function SidePanelToggleButton({ promise, isSidePanelOpen, setIsSidePanelOpen }: { promise: Promise<any>; isSidePanelOpen: boolean; setIsSidePanelOpen: (open: boolean) => void }) {
  const extraData = React.use(promise) as any;
  if (!extraData) return null;

  const videoUrl = extraData.lesson?.videoUrl || extraData.videoUrl;
  const audioUrl = extraData.lesson?.audioUrl || extraData.audioUrl;
  const hasMaterialSection = videoUrl || audioUrl || (extraData.readingText && String(extraData.readingText).replace(/<[^>]*>/g, "").trim().length > 0);
  
  const hasInstructionText = extraData.instructions && (
    String(extraData.instructions).replace(/<[^>]*>/g, "").trim().length > 0 || 
    /<(img|video|audio|iframe|embed)\b/i.test(String(extraData.instructions))
  );

  const hasTags = !!extraData.tags;

  if (!hasMaterialSection && !hasInstructionText && !hasTags) {
    return null;
  }

  return (
    <button
      onClick={() => setIsSidePanelOpen(true)}
      className={`flex items-center justify-center p-2 bg-white text-purple-600 rounded-full border-2 border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all active:scale-95 shadow-sm hover:scale-105 duration-200 ${
        isSidePanelOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      title="View lesson"
    >
      <BookOpen className="w-5 h-5 text-purple-500" />
    </button>
  );
}
