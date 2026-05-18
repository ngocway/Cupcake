"use client";

import React, { useState, useRef, useEffect } from 'react';
import { saveParsedLesson } from '@/actions/lesson-ai';
import { getSystemMetadata } from '@/actions/material-actions';
import { useRouter } from 'next/navigation';

interface AiGeneratorModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (id?: string) => void;
}

const TEMPLATE_CONTENT = `[THONG TIN]
Tieu de: Bài học Tiếng Anh số 1
Mon hoc: Tiếng Anh
Cap do: Lớp 10
Doi tuong: Teens
Tu khoa: grammar, test, beginner
Mo ta: Bài học mẫu tạo từ file TXT.
So tu vung: 2
So cau hoi: 3

[TU VUNG]
wondered | /ˈwʌn.dɚd/ | tự hỏi | to ask yourself questions | I wondered what he was doing.
imagined | /ɪˈmædʒ.ɪnd/ | tưởng tượng | to form a picture in your mind | He imagined a future without war.

[BAI DOC]
Welcome to the English class. Today we will learn about present continuous tense.
She is going to school. People wondered what she was doing. They imagined a great future.

[CAU HOI 1]
Loai: TRAC NGHIEM
Noi dung: She ___ to school every day.
Diem: 1
Dap an dung: goes
Dap an sai: go
Dap an sai: is going
Dap an sai: gone
Giai thich: Chủ ngữ "She" là ngôi thứ 3 số ít.

[CAU HOI 2]
Loai: DUNG SAI
Noi dung: Mặt trời mọc ở hướng Tây.
Diem: 1
Dap an dung: Sai
Giai thich: Mặt trời luôn mọc ở hướng Đông.

[CAU HOI 3]
Loai: DIEN TU
Noi dung: I enjoy {{playing}} soccer in the morning.
Diem: 1
Giai thich: Sau enjoy dùng V-ing.`;

function generateDynamicPrompt(categories: string[], grades: string[], audiences: string[], tags: string[]) {
  return `Đóng vai một chuyên gia giáo dục, hãy tạo cho tôi một bài học kèm bài tập theo chủ đề: [NHẬP CHỦ ĐỀ CỦA BẠN VÀO ĐÂY]

Bạn phải TRẢ VỀ ĐÚNG CẤU TRÚC TEXT DƯỚI ĐÂY (không thêm bất kỳ lời chào hay giải thích nào khác ở đầu/cuối), để tôi có thể copy lưu thành file .txt chuẩn.

Lưu ý khi điền dữ liệu:
- Mon hoc: Chọn một trong [${categories.join(', ')}]
- Cap do: Chọn một trong [${grades.join(', ')}]
- Doi tuong: Chọn một trong [${audiences.join(', ')}]
- Tu khoa: Có thể chọn từ [${tags.join(', ')}] hoặc tự do thêm mới
- Chỉ được dùng 3 loại câu hỏi: TRAC NGHIEM, DUNG SAI, DIEN TU
- Tất cả nội dung bài học, câu hỏi, giải thích đều là ngôn ngữ tiếng Anh.
- Nội dung bài học từ 1000 đến 1500 chữ, phù hợp với các dữ liệu phía trên (Môn học, cấp độ, đối tượng, từ khóa...).
- Hãy trích xuất từ vựng khó hoặc nổi bật nhất từ bài đọc. Số lượng dựa theo trường "So tu vung" ở phần THONG TIN. Định dạng dưới thẻ [TU VUNG] với cấu trúc: Từ vựng | Phiên âm | Nghĩa Tiếng Việt | Giải thích Tiếng Anh | Câu ví dụ
- Tạo câu hỏi dựa theo số lượng ở trường "So cau hoi" ở phần THONG TIN. Nội dung các câu hỏi dựa trên nội dung bài học.

==========
[THONG TIN]
Tieu de: <Tiêu đề bài học>
Mon hoc: <Chọn môn học>
Cap do: <Chọn cấp độ>
Doi tuong: <Chọn đối tượng>
Tu khoa: <Danh sách từ khóa cách nhau bởi dấu phẩy>
Mo ta: <Mô tả ngắn>
So tu vung: <Số lượng từ vựng cần trích xuất, VD: 5, 10, 20>
So cau hoi: <Số lượng câu hỏi cần tạo, VD: 5, 10>

[TU VUNG]
<Từ 1> | <Phiên âm 1> | <Nghĩa Tiếng Việt 1> | <Giải thích Tiếng Anh 1> | <Câu ví dụ 1>
...
<Từ N> | <Phiên âm N> | <Nghĩa Tiếng Việt N> | <Giải thích Tiếng Anh N> | <Câu ví dụ N>

[BAI DOC]
<Nội dung bài đọc/văn bản. Nếu không có bài đọc thì hãy xóa dòng [BAI DOC] đi>

[CAU HOI 1]
Loai: TRAC NGHIEM
Noi dung: <Nội dung câu hỏi>
Diem: 1
Dap an dung: <Đáp án đúng>
Dap an sai: <Đáp án sai 1>
Dap an sai: <Đáp án sai 2>
Dap an sai: <Đáp án sai 3>
Giai thich: <Giải thích>

[CAU HOI 2]
Loai: DUNG SAI
Noi dung: <Nhận định đúng sai>
Diem: 1
Dap an dung: <Ghi Đúng hoặc Sai>
Giai thich: <Giải thích>

[CAU HOI 3]
Loai: DIEN TU
Noi dung: <Câu có chứa phần điền từ được bọc trong ngoặc kép, vd: The sun rises in the {{East}}>
Diem: 1
Giai thich: <Giải thích>
==========`;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (isOpen === false) return null;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [inputText, setInputText] = useState("");
  const [progress, setProgress] = useState(0);
  const [dynamicPrompt, setDynamicPrompt] = useState(generateDynamicPrompt(
    ['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng'], 
    ['Lớp 10', 'Lớp 11', 'Lớp 12'], 
    ['Kids', 'Teens', 'Adults', 'Business'],
    ['Ngữ pháp', 'Từ vựng', 'Giao tiếp']
  ));

  useEffect(() => {
    getSystemMetadata().then(meta => {
      const cats = meta.categories.length > 0 ? meta.categories : ['Tiếng Anh', 'Khác'];
      const grades = meta.gradeLevels.length > 0 ? meta.gradeLevels : ['Lớp 1', 'Lớp 12', 'Khác'];
      const audiences = meta.targetAudiences.length > 0 ? meta.targetAudiences : ['Kids', 'Teens', 'Adults', 'Business'];
      const tagsList = meta.tags.length > 0 ? meta.tags : ['Ngữ pháp', 'Từ vựng', 'Giao tiếp'];
      setDynamicPrompt(generateDynamicPrompt(cats, grades, audiences, tagsList));
    }).catch(console.error);
  }, []);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_CONTENT);
    alert("Đã copy cấu trúc mẫu!");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(dynamicPrompt);
    alert("Đã copy Prompt! Bạn có thể dán vào ChatGPT.");
  };

  const parseTxt = (text: string) => {
    const parseErrors: string[] = [];
    const data: any = { title: "", subject: "", gradeLevel: "", targetAudience: "", shortDescription: "", tags: "", passage: "", vocabularies: [], questions: [] };

    // Support both Windows \r\n and Unix \n newlines
    const lines = text.split(/\r?\n/);
    let currentSection = "";
    let currentQuestion: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.substring(1, line.length - 1).toUpperCase();
        currentSection = sectionName;
        if (sectionName.startsWith('CAU HOI')) {
          if (currentQuestion) {
            data.questions.push(currentQuestion);
          }
          currentQuestion = { type: "", points: 1, explanation: "", content: {}, noiDung: "", dapAnSai: [] };
        }
        continue;
      }

      if (currentSection === "THONG TIN") {
        if (line.toLowerCase().startsWith("tieu de:")) data.title = line.substring(8).trim();
        else if (line.toLowerCase().startsWith("mon hoc:")) data.subject = line.substring(8).trim();
        else if (line.toLowerCase().startsWith("cap do:")) data.gradeLevel = line.substring(7).trim();
        else if (line.toLowerCase().startsWith("doi tuong:")) {
          const val = line.substring(10).trim().toLowerCase();
          if (val.includes("kid") || val.includes("trẻ")) data.targetAudience = "kids";
          else if (val.includes("teen") || val.includes("thiếu")) data.targetAudience = "teens";
          else if (val.includes("adult") || val.includes("lớn")) data.targetAudience = "adults";
          else if (val.includes("business") || val.includes("doanh")) data.targetAudience = "business";
          else data.targetAudience = val;
        }
        else if (line.toLowerCase().startsWith("tu khoa:")) data.tags = line.substring(8).trim();
        else if (line.toLowerCase().startsWith("mo ta:")) data.shortDescription = line.substring(6).trim();
      } else if (currentSection === "TU VUNG") {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          data.vocabularies.push({
            word: parts[0],
            pronunciation: parts[1] || '',
            meaningVi: parts[2] || '',
            explanationEn: parts[3] || '',
            examples: parts[4] || ''
          });
        }
      } else if (currentSection === "BAI DOC") {
        data.passage += (data.passage ? '\n' : '') + line;
      } else if (currentSection.startsWith("CAU HOI") && currentQuestion) {
        if (line.toLowerCase().startsWith("loai:")) {
          const typeStr = line.substring(5).trim().toUpperCase();
          if (typeStr === "TRAC NGHIEM") currentQuestion.type = "MULTIPLE_CHOICE";
          else if (typeStr === "DUNG SAI") currentQuestion.type = "TRUE_FALSE";
          else if (typeStr === "DIEN TU") currentQuestion.type = "CLOZE_TEST";
          else parseErrors.push(`Dòng ${i + 1}: Loại câu hỏi không hợp lệ "${typeStr}". Chỉ hỗ trợ TRAC NGHIEM, DUNG SAI, DIEN TU.`);
        } else if (line.toLowerCase().startsWith("noi dung:")) {
          currentQuestion.noiDung = line.substring(9).trim();
        } else if (line.toLowerCase().startsWith("diem:")) {
          currentQuestion.points = parseFloat(line.substring(5).trim()) || 1;
        } else if (line.toLowerCase().startsWith("dap an dung:")) {
          currentQuestion.dapAnDung = line.substring(12).trim();
        } else if (line.toLowerCase().startsWith("dap an sai:")) {
          currentQuestion.dapAnSai.push(line.substring(11).trim());
        } else if (line.toLowerCase().startsWith("giai thich:")) {
          currentQuestion.explanation = line.substring(11).trim();
        }
      }
    }

    if (currentQuestion) data.questions.push(currentQuestion);

    // Validate
    data.questions.forEach((q: any, idx: number) => {
      const qNum = idx + 1;
      if (!q.type) parseErrors.push(`[Câu ${qNum}] Thiếu 'Loai:'.`);
      if (!q.noiDung) parseErrors.push(`[Câu ${qNum}] Thiếu 'Noi dung:'.`);

      if (q.type === "MULTIPLE_CHOICE") {
        if (!q.dapAnDung) parseErrors.push(`[Câu ${qNum}] Trắc nghiệm cần có 'Dap an dung:'.`);
        if (!q.dapAnSai || q.dapAnSai.length === 0) parseErrors.push(`[Câu ${qNum}] Trắc nghiệm cần ít nhất 1 'Dap an sai:'.`);
        
        q.content = {
          questionText: q.noiDung,
          options: [
            { id: Math.random().toString(36).substring(2), text: q.dapAnDung, isCorrect: true },
            ...(q.dapAnSai || []).map((t: string) => ({ id: Math.random().toString(36).substring(2), text: t, isCorrect: false }))
          ]
        };
      } else if (q.type === "TRUE_FALSE") {
        if (!q.dapAnDung) parseErrors.push(`[Câu ${qNum}] Đúng/Sai cần có 'Dap an dung:'.`);
        const isTrue = q.dapAnDung?.toLowerCase() === "đúng" || q.dapAnDung?.toLowerCase() === "dung" || q.dapAnDung?.toLowerCase() === "true";
        q.content = {
          statement: q.noiDung,
          isTrue: isTrue
        };
      } else if (q.type === "CLOZE_TEST") {
        if (!q.noiDung?.includes("{{")) parseErrors.push(`[Câu ${qNum}] Điền từ cần có dấu {{đáp án}} trong nội dung.`);
        q.content = {
          textWithBlanks: q.noiDung
        };
      }
    });
    // Auto-highlight vocabularies in passage (first occurrence only to avoid clutter)
    if (data.passage && data.vocabularies && data.vocabularies.length > 0) {
      data.vocabularies.forEach((vocab: any, index: number) => {
        const vocabId = 'vocab-' + Date.now() + '-' + index;
        const escapedWord = vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match the exact word, case-insensitive, capture it to retain original casing
        const regex = new RegExp(`\\b(${escapedWord})\\b`, 'i'); 
        const escapeHtml = (str: string) => (str || '').replace(/"/g, '&quot;');
        const html = `<span class="relative inline-block custom-vocab-marker group/marker" data-vocab-id="${vocabId}" data-word="${escapeHtml(vocab.word)}" data-pronunciation="${escapeHtml(vocab.pronunciation)}" data-meaning-vi="${escapeHtml(vocab.meaningVi)}" data-explanation-en="${escapeHtml(vocab.explanationEn)}" data-examples="${escapeHtml(vocab.examples)}" data-image="" contenteditable="false"><span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-md cursor-help border-b-2 border-emerald-500 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition-all duration-200">$1</span></span>`;
        
        data.passage = data.passage.replace(regex, html);
      });
    }

    return { data, errors: parseErrors };
  };

  const handleParseText = async () => {
    if (!inputText.trim()) {
      setErrors(["Vui lòng dán nội dung vào ô nhập."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(p => (p < 90 ? p + 10 : p));
    }, 400);

    try {
      const { data, errors } = parseTxt(inputText);

      if (errors.length > 0) {
        setErrors(errors);
        setLoading(false);
        clearInterval(interval);
        setProgress(0);
        return;
      }

      setProgress(50);
      const res = await saveParsedLesson(data);
      clearInterval(interval);
      setProgress(100);

      if (res.error) {
        setErrors([res.error]);
        setLoading(false);
        setProgress(0);
      } else if (res.success && res.id) {
        setTimeout(() => {
          onClose();
          onSuccess(res.id);
        }, 500);
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrors([err.message || "Lỗi không xác định khi xử lý dữ liệu."]);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">upload_file</span>
            <h3 className="text-xl font-bold font-headline">Tạo bài học từ File</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-6 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-2xl w-full text-sm text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold">💡 Hướng dẫn:</p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowPrompt(!showPrompt); setShowTemplate(false); }}
                  className="flex items-center gap-1 text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  {showPrompt ? "Ẩn Prompt" : "Prompt ChatGPT"}
                </button>
                <button 
                  onClick={() => { setShowTemplate(!showTemplate); setShowPrompt(false); }}
                  className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">{showTemplate ? "visibility_off" : "visibility"}</span>
                  {showTemplate ? "Ẩn mẫu" : "Xem file mẫu"}
                </button>
              </div>
            </div>
            <p>1. Sao chép mẫu cấu trúc hoặc dùng lệnh Prompt dán vào ChatGPT để tạo tự động.</p>
            <p>2. Điền nội dung theo mẫu (hoặc sao chép kết quả từ ChatGPT).</p>
            <p>3. Dán nội dung vào ô bên dưới, hệ thống sẽ bóc tách và tạo bài học tự động (0 token AI).</p>
          </div>

          {showTemplate && (
            <div className="w-full text-left relative text-[11px] animate-in slide-in-from-top-2">
              <button 
                onClick={handleCopyTemplate}
                className="absolute top-2 right-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-lg flex items-center gap-1.5 transition-colors z-10 font-bold"
                title="Copy mẫu"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                Copy cấu trúc
              </button>
              <pre className="bg-slate-100 dark:bg-gray-800 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[30vh] custom-scrollbar border border-slate-200 dark:border-gray-700 font-mono text-slate-700 dark:text-slate-300">
                {TEMPLATE_CONTENT}
              </pre>
            </div>
          )}

          {showPrompt && (
            <div className="w-full text-left relative text-[11px] animate-in slide-in-from-top-2">
              <button 
                onClick={handleCopyPrompt}
                className="absolute top-2 right-2 bg-indigo-200 hover:bg-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-600 p-2 rounded-lg flex items-center gap-1.5 transition-colors z-10 font-bold text-indigo-900 dark:text-indigo-100"
                title="Copy prompt"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                Copy Prompt
              </button>
              <pre className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[30vh] custom-scrollbar border border-indigo-100 dark:border-indigo-800/30 font-mono text-slate-700 dark:text-slate-300">
                {dynamicPrompt}
              </pre>
            </div>
          )}

          {errors.length > 0 && (
            <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl text-left text-sm max-h-40 overflow-y-auto custom-scrollbar border border-red-100">
              <p className="font-bold mb-2">❌ Lỗi phân tích nội dung:</p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="w-full flex flex-col gap-4">
            <textarea
              className="w-full h-40 p-4 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700 custom-scrollbar resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-slate-200"
              placeholder="Dán nội dung bài học (.txt) vào đây..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
            ></textarea>
            
            {loading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            )}

            <button 
              onClick={handleParseText}
              disabled={loading || !inputText.trim()}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Đang xử lý {progress}%...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span>Tạo bài học ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
        `}</style>
      </div>
    </div>
  );
};

