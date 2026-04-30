"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Save, ArrowLeft, CheckCircle2, BookOpen, ListTree, HelpCircle, XCircle } from "lucide-react";
import { generateAILesson, saveAILesson, AILessonResponse } from "@/actions/lesson-ai";

export default function AILessonGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lessonData, setLessonData] = useState<AILessonResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Form states
  const [config, setConfig] = useState({
    topic: "",
    gradeLevel: "Khác",
    subject: "Khác",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
    questionCount: 5,
  });

  const handleGenerate = async () => {
    if (!config.topic) {
      showToast("Vui lòng nhập chủ đề bài học.", "error");
      return;
    }

    setLoading(true);
    setLessonData(null);
    try {
      const response = await generateAILesson(config);
      if ("error" in response) {
        showToast(response.error, "error");
      } else {
        setLessonData(response);
        showToast("Đã tạo nội dung bài học bằng AI!");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra khi tạo bài học.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lessonData) return;

    setSaving(true);
    try {
      const response = await saveAILesson({
        ...lessonData,
        gradeLevel: config.gradeLevel,
        subject: config.subject,
      });

      if ("error" in response) {
        showToast(response.error, "error");
      } else {
        showToast("Đã lưu bài học thành công!");
        router.push(`/admin/materials`);
      }
    } catch (error) {
      showToast("Không thể lưu bài học.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in duration-500 relative">
      {/* Local Toast UI */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-full">
           <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
             toast.type === 'success' 
             ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
             : 'bg-red-100 text-red-900 border-red-200'
           }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <p className="font-bold text-sm tracking-tight">{toast.message}</p>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Lesson Creator</h1>
            <p className="text-muted-foreground">Tạo bài đọc, từ vựng và câu hỏi tự động bằng AI Gemini.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CONFIG PANEL */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" /> Cấu hình AI
            </CardTitle>
            <CardDescription>Thiết lập các tham số để AI hiểu ngữ cảnh bài học.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Chủ đề bài học</Label>
              <Input 
                id="topic" 
                placeholder="Ví dụ: Bảo vệ môi trường, Trí tuệ nhân tạo..." 
                value={config.topic}
                onChange={(e) => setConfig({...config, topic: e.target.value})}
              />
            </div>

            {/* Grade and Subject are now internal defaults to simplify UI */}
            <input type="hidden" value={config.gradeLevel} />
            <input type="hidden" value={config.subject} />

            <div className="space-y-3">
              <Label>Độ khó</Label>
              <RadioGroup 
                value={config.difficulty} 
                onValueChange={(val: any) => setConfig({...config, difficulty: val})}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EASY" id="easy" />
                  <Label htmlFor="easy" className="font-normal">Dễ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MEDIUM" id="medium" />
                  <Label htmlFor="medium" className="font-normal">Vừa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HARD" id="hard" />
                  <Label htmlFor="hard" className="font-normal">Khó</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qCount">Số lượng câu hỏi: {config.questionCount}</Label>
              <Input 
                id="qCount" 
                type="range" 
                min="3" 
                max="10" 
                step="1" 
                value={config.questionCount}
                onChange={(e) => setConfig({...config, questionCount: parseInt(e.target.value)})}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</> : <><Sparkles className="w-4 h-4 mr-2" /> Bắt đầu tạo</>}
            </Button>
          </CardFooter>
        </Card>

        {/* PREVIEW PANEL */}
        <div className="md:col-span-2 space-y-6">
          {!lessonData && !loading && (
            <div className="h-[500px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-slate-50/50">
              <Sparkles className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">Chưa có nội dung được tạo</h3>
              <p>Điền thông tin ở bảng bên trái và nhấn "Bắt đầu tạo" để AI soạn thảo bài học cho bạn.</p>
            </div>
          )}

          {loading && (
            <Card className="h-[500px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">AI đang suy nghĩ...</p>
                <p className="text-sm text-muted-foreground">Đang biên soạn bài đọc, trích xuất từ vựng và câu hỏi.</p>
              </div>
            </Card>
          )}

          {lessonData && (
            <Card className="border-2 border-blue-100 shadow-xl animate-in zoom-in-95 duration-300">
              <CardHeader className="border-b bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-blue-900">{lessonData.title}</CardTitle>
                    <CardDescription className="text-blue-700/70 mt-1">{lessonData.shortDescription}</CardDescription>
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu bài tập</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="passage" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="passage" className="flex gap-2">
                       <BookOpen className="w-4 h-4" /> Bài đọc
                    </TabsTrigger>
                    <TabsTrigger value="vocabulary" className="flex gap-2">
                       <ListTree className="w-4 h-4" /> Từ vựng
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex gap-2">
                       <HelpCircle className="w-4 h-4" /> Câu hỏi
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="passage" className="space-y-4 focus-visible:outline-none">
                    <div className="prose prose-slate max-w-none bg-white p-6 rounded-lg border leading-relaxed text-slate-700">
                      {lessonData.passage.split("\n").map((para, i) => (
                        <p key={i} className="mb-4">{para}</p>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="vocabulary" className="space-y-4 focus-visible:outline-none">
                    <div className="grid grid-cols-1 gap-4">
                      {lessonData.vocabulary.map((v, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl font-bold text-blue-700">{v.word}</span>
                            <span className="text-sm font-mono text-slate-500">{v.pronunciation}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mb-1">{v.meaningVi}</p>
                          <p className="text-sm text-slate-600 italic mb-2">"{v.explanationEn}"</p>
                          <div className="pl-4 border-l-2 border-blue-200 space-y-1">
                            {v.examples.map((ex, j) => (
                              <p key={j} className="text-xs text-slate-500">• {ex}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="questions" className="space-y-6 focus-visible:outline-none">
                    {lessonData.questions.map((q, i) => (
                      <div key={i} className="p-6 border rounded-xl bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">{q.questionText}</h4>
                        
                        {q.type === 'MULTIPLE_CHOICE' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {q.options?.map((opt, j) => (
                              <div 
                                key={j} 
                                className={`p-3 border rounded-lg flex items-center justify-between ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200'}`}
                              >
                                <span className={opt.isCorrect ? 'text-emerald-700 font-medium' : 'text-slate-600'}>{opt.text}</span>
                                {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-4 mb-4">
                             <div className={`px-6 py-2 border rounded-full font-bold ${q.isTrue ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>Đúng</div>
                             <div className={`px-6 py-2 border rounded-full font-bold ${!q.isTrue ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 text-slate-400'}`}>Sai</div>
                          </div>
                        )}

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                          <p className="text-sm text-amber-900 leading-snug">
                            <span className="font-bold">Giải thích: </span>
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
