"use client";

import React, { useState, useRef, useEffect } from 'react';
import { saveParsedLesson } from '@/actions/lesson-ai';
import { getSystemMetadata } from '@/actions/material-actions';
import { getCategoryTree } from '@/actions/category-actions';
import { getPopularTags } from '@/actions/tag-actions';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Sparkles, X, Wand2, Copy, RefreshCw, FolderPlus } from 'lucide-react';

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
So cau hoi: 4

[TU VUNG]
wondered | /ˈwʌn.dɚd/ | tự hỏi | สงสัย | bertanya-tanya | to ask yourself questions | I wondered what he was doing.
imagined | /ɪˈmædʒ.ɪnd/ | tưởng tượng | จินตนาการ | membayangkan | to form a picture in your mind | He imagined a future without war.

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
Loai: TRAC NGHIEM NHIEU DAP AN
Noi dung: Những từ nào sau đây là động từ ở thì quá khứ?
Diem: 1
Dap an dung: wondered
Dap an dung: imagined
Dap an sai: go
Dap an sai: school
Giai thich: "wondered" và "imagined" kết thúc bằng đuôi -ed là động từ quá khứ.

[CAU HOI 3]
Loai: DUNG SAI
Noi dung: Mặt trời mọc ở hướng Tây.
Diem: 1
Dap an dung: Sai
Giai thich: Mặt trời luôn mọc ở hướng Đông.

[CAU HOI 4]
Loai: DIEN TU
Noi dung: I enjoy {{playing}} soccer in the morning.
Diem: 1
Giai thich: Sau enjoy dùng V-ing.`;

const generateCustomPrompt = (params: any) => {
  const { reference, audience, category, language, length, mcqCount, mcqMultiCount, tfCount, clozeCount, vocabCount } = params;
  const totalQuestions = mcqCount + mcqMultiCount + tfCount + clozeCount;

  let prompt = `Đóng vai một chuyên gia giáo dục và người tạo nội dung khóa học. `;
  
  const refText = reference ? reference.trim() : "";
  if (refText) {
    if (refText.startsWith('http://') || refText.startsWith('https://') || refText.startsWith('www.')) {
      prompt += `Vui lòng tạo một bài học dựa trên nội dung từ đường link tham khảo sau: ${refText}\n`;
    } else {
      prompt += `Hãy tạo cho tôi một bài học theo chủ đề: "${refText}".\n`;
    }
  } else {
    prompt += `Hãy tự chọn một chủ đề thú vị và sáng tạo để tạo bài học.\n`;
  }

  prompt += `\nBài học này dành cho đối tượng: ${audience === 'All' ? 'Tất cả mọi người' : audience}.\n`;
  
  let difficultyInstruction = "Sử dụng từ vựng và ngữ pháp phổ thông, dễ hiểu, phù hợp với đại đa số người học.";
  const aud = audience.toLowerCase();
  if (aud.includes("kid") || aud.includes("trẻ")) {
    difficultyInstruction = "Sử dụng từ vựng cực kỳ cơ bản, ngữ pháp đơn giản (chủ yếu là câu đơn), văn phong vui nhộn, thân thiện và các chủ đề gần gũi với trẻ em.";
  } else if (aud.includes("teen") || aud.includes("thiếu")) {
    difficultyInstruction = "Sử dụng từ vựng ở mức trung cấp (B1-B2), câu ghép phổ biến, văn phong năng động, các chủ đề thu hút thanh thiếu niên (học đường, xu hướng, bạn bè).";
  } else if (aud.includes("adult") || aud.includes("lớn") || aud.includes("business") || aud.includes("doanh")) {
    difficultyInstruction = "Sử dụng từ vựng học thuật hoặc chuyên ngành, ngữ pháp đa dạng (câu phức, mệnh đề quan hệ), văn phong trang trọng, chuyên nghiệp.";
  }
  prompt += `Độ khó & Văn phong yêu cầu: ${difficultyInstruction}\n`;
  
  prompt += `Môn học / Phân loại: ${category}.\n`;
  prompt += `Ngôn ngữ bài học: ${language}.\n`;
  prompt += `Độ dài bài đọc: ${length}.\n`;
  
  if (vocabCount > 0) {
    prompt += `Số lượng từ vựng cần trích xuất: ${vocabCount} từ vựng khó hoặc nổi bật nhất.\n`;
  } else {
    prompt += `Không cần trích xuất từ vựng khó cho bài học này.\n`;
  }

  prompt += `\nYêu cầu chi tiết về câu hỏi (Tổng cộng ${totalQuestions} câu):\n`;
  prompt += `- ${mcqCount} câu Trắc nghiệm một đáp án đúng (TRAC NGHIEM)\n`;
  prompt += `- ${mcqMultiCount} câu Trắc nghiệm nhiều đáp án đúng (TRAC NGHIEM NHIEU DAP AN)\n`;
  prompt += `- ${tfCount} câu Đúng/Sai (DUNG SAI)\n`;
  prompt += `- ${clozeCount} câu Điền từ (DIEN TU)\n`;

  prompt += `
YÊU CẦU QUAN TRỌNG:
${vocabCount > 0 ? `- Trích xuất khoảng ${vocabCount} từ vựng khó hoặc nổi bật nhất từ bài đọc.` : `- KHÔNG TẠO PHẦN TỪ VỰNG [TU VUNG].`}
- BẠN PHẢI TRẢ VỀ ĐÚNG CẤU TRÚC TEXT DƯỚI ĐÂY, không thêm bất kỳ lời chào, giải thích hay định dạng markdown nào khác (chỉ trả về plain text để tôi có thể parse tự động).
- Thay thế các nội dung trong ngoặc <...> bằng dữ liệu thật.
- PHẦN TỪ VỰNG [TU VUNG]: Mỗi từ phải có ĐỦ 7 TRƯỜNG cách nhau bằng dấu | theo đúng thứ tự: Từ | Phiên âm IPA | Nghĩa Tiếng Việt | Nghĩa Tiếng Thái | Nghĩa Tiếng Indonesia | Giải thích Tiếng Anh | Câu ví dụ. KHÔNG ĐƯỢC bỏ trống trường Nghĩa Tiếng Thái và Nghĩa Tiếng Indonesia.
- PHẦN GIẢI THÍCH [Giai thich] TRONG CÂU HỎI: BẮT BUỘC viết RẤT CHI TIẾT (ít nhất 2-3 câu) VÀ VIẾT HOÀN TOÀN BẰNG TIẾNG ANH (ENGLISH). Trình bày rõ ràng TẠI SAO đáp án đúng lại đúng, VÀ TẠI SAO TỪNG đáp án khác lại sai. TUYỆT ĐỐI KHÔNG dùng các từ chỉ vị trí (như "the first option", "option A", "the last one") vì các đáp án sẽ bị xáo trộn. Hãy trích dẫn trực tiếp nội dung của đáp án đó.

==========
[THONG TIN]
Tieu de: <Tiêu đề bài học>
Mon hoc: ${category}
Cap do: <Chọn cấp độ phù hợp>
Doi tuong: ${audience}
Tu khoa: <Danh sách từ khóa cách nhau bởi dấu phẩy>
Mo ta: <Mô tả ngắn về bài học>
So tu vung: ${vocabCount}
So cau hoi: ${totalQuestions}
`;

  if (vocabCount > 0) {
    prompt += `
[TU VUNG]
# Cột: Từ | Phiên âm IPA | Nghĩa Tiếng Việt | Nghĩa Tiếng Thái | Nghĩa Tiếng Indonesia | Giải thích Tiếng Anh | Câu ví dụ
<Từ 1> | <Phiên âm IPA 1> | <Nghĩa Tiếng Việt 1> | <Nghĩa Tiếng Thái 1 - KHÔNG được bỏ trống> | <Nghĩa Tiếng Indonesia 1 - KHÔNG được bỏ trống> | <Giải thích Tiếng Anh ngắn gọn 1> | <Câu ví dụ Tiếng Anh 1>
...
<Từ ${vocabCount}> | <Phiên âm IPA ${vocabCount}> | <Nghĩa Tiếng Việt ${vocabCount}> | <Nghĩa Tiếng Thái ${vocabCount} - KHÔNG được bỏ trống> | <Nghĩa Tiếng Indonesia ${vocabCount} - KHÔNG được bỏ trống> | <Giải thích Tiếng Anh ngắn gọn ${vocabCount}> | <Câu ví dụ Tiếng Anh ${vocabCount}>
`;
  }

  prompt += `
[BAI DOC]
<Nội dung bài đọc/văn bản bằng ngôn ngữ ${language}>
`;

  let questionIndex = 1;
  for (let i = 0; i < mcqCount; i++) {
    prompt += `
[CAU HOI ${questionIndex}]
Loai: TRAC NGHIEM
Noi dung: <Nội dung câu hỏi>
Diem: 1
Dap an dung: <Đáp án đúng>
Dap an sai: <Đáp án sai 1>
Dap an sai: <Đáp án sai 2>
Dap an sai: <Đáp án sai 3>
Giai thich: <Giải thích rất chi tiết, tại sao chọn đáp án này mà không phải đáp án kia, tại sao các đáp án kia sai>
`;
    questionIndex++;
  }

  for (let i = 0; i < mcqMultiCount; i++) {
    prompt += `
[CAU HOI ${questionIndex}]
Loai: TRAC NGHIEM NHIEU DAP AN
Noi dung: <Nội dung câu hỏi trắc nghiệm có nhiều đáp án đúng>
Diem: 1
Dap an dung: <Đáp án đúng thứ nhất>
Dap an dung: <Đáp án đúng thứ hai>
Dap an sai: <Đáp án sai thứ nhất>
Dap an sai: <Đáp án sai thứ hai>
Giai thich: <Giải thích rất chi tiết, tại sao các đáp án đúng lại đúng và tại sao các đáp án sai lại sai>
`;
    questionIndex++;
  }

  for (let i = 0; i < tfCount; i++) {
    prompt += `
[CAU HOI ${questionIndex}]
Loai: DUNG SAI
Noi dung: <Nhận định đúng sai>
Diem: 1
Dap an dung: <Ghi Đúng hoặc Sai>
Giai thich: <Giải thích rất chi tiết tại sao nhận định này lại đúng hoặc sai>
`;
    questionIndex++;
  }

  for (let i = 0; i < clozeCount; i++) {
    prompt += `
[CAU HOI ${questionIndex}]
Loai: DIEN TU
Noi dung: <Câu có chứa phần điền từ được bọc trong ngoặc kép, vd: The sun rises in the {{East}}>
Diem: 1
Giai thich: <Giải thích rất chi tiết lý do tại sao lại điền từ này mà không phải từ khác>
`;
    questionIndex++;
  }

  prompt += `\n==========`;
  return prompt;
};

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (isOpen === false) return null;
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [progress, setProgress] = useState(0);

  // Form states
  const [reference, setReference] = useState("");
  const [audience, setAudience] = useState("All");
  const [category, setCategory] = useState("Tiếng Anh");
  const [language, setLanguage] = useState("Tiếng Anh");
  const [length, setLength] = useState("Trung bình (~400 từ)");
  const [mcqCount, setMcqCount] = useState(3);
  const [mcqMultiCount, setMcqMultiCount] = useState(0);
  const [tfCount, setTfCount] = useState(2);
  const [clozeCount, setClozeCount] = useState(0);
  const [vocabCount, setVocabCount] = useState(5);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const [categoriesTree, setCategoriesTree] = useState<any[]>([]);
  const [audiencesList, setAudiencesList] = useState<string[]>(['All', 'Kids', 'Teens', 'Adults', 'Business']);
  const [popularTagsList, setPopularTagsList] = useState<string[]>(['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi']);

  const getDisplayName = (node: any) => {
    if (!node) return "";
    return (locale === "vi" ? (node.nameVi || node.nameEn) : (node.nameEn || node.nameVi)) || "";
  };

  useEffect(() => {
    getSystemMetadata().then(meta => {
      if (meta.targetAudiences.length > 0) {
        const normalizedAuds = meta.targetAudiences
          .map((a: string) => a.trim().charAt(0).toUpperCase() + a.trim().slice(1).toLowerCase())
          .filter((a: string) => a !== 'All');
        const uniqueAuds = Array.from(new Set(normalizedAuds));
        setAudiencesList(['All', ...uniqueAuds]);
      }
    }).catch(console.error);

    getCategoryTree().then(tree => {
      setCategoriesTree(tree);
      if (tree.length > 0) {
        setCategory(getDisplayName(tree[0]));
      }
    }).catch(console.error);

    getPopularTags().then(tags => {
      if (tags && tags.length > 0) {
        setPopularTagsList(tags);
      }
    }).catch(err => {
      console.error("Failed to load popular tags, using fallback", err);
    });
  }, [locale]);

  const handleGeneratePrompt = () => {
    const prompt = generateCustomPrompt({
      reference, audience, category, language, length, mcqCount, mcqMultiCount, tfCount, clozeCount, vocabCount
    });
    setGeneratedPrompt(prompt);
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    alert("Đã copy Prompt! Bạn có thể dán vào ChatGPT.");
  };

  const parseTxt = (text: string) => {
    const parseErrors: string[] = [];
    const data: any = { title: "", subject: "", gradeLevel: "", targetAudience: "", shortDescription: "", tags: "", passage: "", vocabularies: [], questions: [] };

    if (text.includes("Đóng vai một chuyên gia giáo dục") || text.includes("<Tiêu đề bài học>") || text.includes("<Nội dung bài đọc") || text.includes("<Nhận định đúng sai>")) {
      return { data, errors: ["⚠️ AI CHƯA TẠO ĐƯỢC BÀI HỌC THỰC SỰ!\n\nCó vẻ như ChatGPT đã 'lười biếng' và chỉ trả lại nguyên xi cấu trúc mẫu chứa các thẻ như <Tiêu đề bài học>, <Nhận định đúng sai>... thay vì điền nội dung thật.\n\nCách khắc phục:\n1. Quay lại ChatGPT và nhắn thêm: 'Hãy viết nội dung thật để thay thế vào các chỗ <...>, KHÔNG trả về định dạng mẫu.'\n2. Hoặc bạn có thể thử mở một đoạn chat mới trên ChatGPT/Claude và dán lại lệnh."] };
    }

    // Support both Windows \r\n and Unix \n newlines
    const lines = text.split(/\r?\n/);
    let currentSection = "";
    let currentQuestion: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentSection === "BAI DOC" && data.passage && !data.passage.endsWith("\n\n")) {
          data.passage += "\n\n";
        }
        continue;
      }

      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.substring(1, line.length - 1).toUpperCase();
        currentSection = sectionName;
        if (sectionName.startsWith('CAU HOI')) {
          if (currentQuestion) {
            data.questions.push(currentQuestion);
          }
          currentQuestion = { type: "", points: 1, explanation: "", content: {}, noiDung: "", dapAnDung: [], dapAnSai: [] };
        }
        continue;
      }

      // Skip comment lines (used as column headers in prompts)
      if (line.startsWith('#')) continue;

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
        else if (line.toLowerCase().startsWith("tu khoa:")) {
          const rawTags = line.substring(8).trim();
          const tagList = rawTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          const allowedTags: string[] = [];
          let customTagCount = 0;
          
          for (const tag of tagList) {
            const isPopular = popularTagsList.some(p => p.toLowerCase() === tag.toLowerCase());
            if (isPopular) {
              allowedTags.push(tag);
            } else {
              if (customTagCount < 3) {
                allowedTags.push(tag);
                customTagCount++;
              }
            }
          }
          data.tags = allowedTags.join(', ');
        }
        else if (line.toLowerCase().startsWith("mo ta:")) data.shortDescription = line.substring(6).trim();
      } else if (currentSection === "TU VUNG") {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          data.vocabularies.push({
            word: parts[0],
            pronunciation: parts[1] || '',
            meaningVi: parts[2] || '',
            meaningTh: parts[3] || '',
            meaningId: parts[4] || '',
            explanationEn: parts[5] || '',
            examples: parts[6] || ''
          });
        }
      } else if (currentSection === "BAI DOC") {
        if (data.passage.endsWith("\n\n")) {
          data.passage += line;
        } else {
          data.passage += (data.passage ? '\n' : '') + line;
        }
      } else if (currentSection.startsWith("CAU HOI") && currentQuestion) {
        if (line.toLowerCase().startsWith("loai:")) {
          const typeStr = line.substring(5).trim().toUpperCase();
          if (typeStr === "TRAC NGHIEM" || typeStr === "TRAC NGHIEM NHIEU DAP AN") {
            currentQuestion.type = "MULTIPLE_CHOICE";
            if (typeStr === "TRAC NGHIEM NHIEU DAP AN") {
              currentQuestion.isMultiple = true;
            }
          }
          else if (typeStr === "DUNG SAI") currentQuestion.type = "TRUE_FALSE";
          else if (typeStr === "DIEN TU") currentQuestion.type = "CLOZE_TEST";
          else parseErrors.push(`Dòng ${i + 1}: Loại câu hỏi không hợp lệ "${typeStr}". Chỉ hỗ trợ TRAC NGHIEM, TRAC NGHIEM NHIEU DAP AN, DUNG SAI, DIEN TU.`);
        } else if (line.toLowerCase().startsWith("noi dung:")) {
          currentQuestion.noiDung = line.substring(9).trim();
        } else if (line.toLowerCase().startsWith("diem:")) {
          currentQuestion.points = parseFloat(line.substring(5).trim()) || 1;
        } else if (line.toLowerCase().startsWith("dap an dung:")) {
          if (Array.isArray(currentQuestion.dapAnDung)) {
            currentQuestion.dapAnDung.push(line.substring(12).trim());
          } else {
            currentQuestion.dapAnDung = [line.substring(12).trim()];
          }
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
        const correctAnswers = Array.isArray(q.dapAnDung) ? q.dapAnDung : (q.dapAnDung ? [q.dapAnDung] : []);
        if (correctAnswers.length === 0) parseErrors.push(`[Câu ${qNum}] Trắc nghiệm cần có ít nhất 1 'Dap an dung:'.`);
        if (!q.dapAnSai || q.dapAnSai.length === 0) parseErrors.push(`[Câu ${qNum}] Trắc nghiệm cần ít nhất 1 'Dap an sai:'.`);
        
        const isMultiple = q.isMultiple || correctAnswers.length > 1;

        q.content = {
          questionText: q.noiDung,
          isMultiple: isMultiple,
          options: [
            ...correctAnswers.map((t: string) => ({ id: Math.random().toString(36).substring(2), text: t, isCorrect: true })),
            ...(q.dapAnSai || []).map((t: string) => ({ id: Math.random().toString(36).substring(2), text: t, isCorrect: false }))
          ]
        };
      } else if (q.type === "TRUE_FALSE") {
        const correctStr = Array.isArray(q.dapAnDung) ? q.dapAnDung[0] : q.dapAnDung;
        if (!correctStr) parseErrors.push(`[Câu ${qNum}] Đúng/Sai cần có 'Dap an dung:'.`);
        const isTrue = correctStr?.toLowerCase() === "đúng" || correctStr?.toLowerCase() === "dung" || correctStr?.toLowerCase() === "true";
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

    if (!data.title) parseErrors.push("Không tìm thấy Tiêu đề bài học (hoặc sai định dạng [THONG TIN]).");
    if (!data.passage) parseErrors.push("Không tìm thấy Nội dung bài đọc (hoặc sai định dạng [BAI DOC]).");
    if (data.questions.length === 0) parseErrors.push("Không tìm thấy Câu hỏi nào (hoặc sai định dạng [CAU HOI ...]).");

    // Auto-highlight vocabularies in passage (first occurrence only to avoid clutter)
    if (data.passage && data.vocabularies && data.vocabularies.length > 0) {
      const placeholders: Record<string, string> = {};
      const uniqueRunId = Date.now();
      
      data.vocabularies.forEach((vocab: any, index: number) => {
        const vocabId = 'vocab-' + uniqueRunId + '-' + index;
        const escapedWord = vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match the exact word, case-insensitive, capture it to retain original casing
        const regex = new RegExp(`\\b(${escapedWord})\\b`, 'i'); 
        
        const match = data.passage.match(regex);
        if (match) {
          const actualWord = match[1];
          const placeholderKey = `__VOCAB_PLACEHOLDER_${uniqueRunId}_${index}__`;
          const escapeHtml = (str: string) => (str || '').replace(/"/g, '&quot;');
          const html = `<span class="relative inline-block custom-vocab-marker group/marker" data-vocab-id="${vocabId}" data-word="${escapeHtml(vocab.word)}" data-pronunciation="${escapeHtml(vocab.pronunciation)}" data-meaning-vi="${escapeHtml(vocab.meaningVi)}" data-meaning-th="${escapeHtml(vocab.meaningTh || '')}" data-meaning-id="${escapeHtml(vocab.meaningId || '')}" data-explanation-en="${escapeHtml(vocab.explanationEn)}" data-examples="${escapeHtml(vocab.examples)}" data-image="" contenteditable="false"><span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-md cursor-help border-b-2 border-emerald-500 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition-all duration-200">${actualWord}</span></span>`;
          
          placeholders[placeholderKey] = html;
          data.passage = data.passage.replace(regex, placeholderKey);
        }
      });
      
      // Restore placeholders
      Object.keys(placeholders).forEach(key => {
        data.passage = data.passage.replace(key, () => placeholders[key]);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] w-full max-w-6xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="px-8 py-5 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md text-white flex justify-between items-center shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-xl font-bold font-headline">Trợ lý tạo Bài học AI</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* COLUMN 1: CREATE PROMPT */}
            <div className="flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 pb-8 lg:pb-0 lg:pr-8">
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                Tạo cấu trúc Prompt
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chủ đề hoặc Link tham khảo (Tùy chọn)</label>
                  <input type="text" className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder='VD: "My Family" hoặc dán đường link https://...' value={reference} onChange={e => setReference(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Môn học / Danh mục</label>
                  <select className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                    {categoriesTree.map((parent) => {
                      const parentName = getDisplayName(parent);
                      return parent.children && parent.children.length > 0 ? (
                        <optgroup key={parent.id} label={parentName}>
                          <option value={parentName}>{parentName} (Chung)</option>
                          {parent.children.map((child: any) => {
                            const childName = getDisplayName(child);
                            return (
                              <option key={child.id} value={childName}>{childName}</option>
                            );
                          })}
                        </optgroup>
                      ) : (
                        <option key={parent.id} value={parentName}>{parentName}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Độ tuổi</label>
                  <select className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" value={audience} onChange={e => setAudience(e.target.value)}>
                    {audiencesList.map((a, i) => <option key={`${a}-${i}`} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ngôn ngữ</label>
                  <select className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Pháp">Tiếng Pháp</option>
                    <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Độ dài văn bản</label>
                  <select className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" value={length} onChange={e => setLength(e.target.value)}>
                    <option value="Rất ngắn (~200 từ)">Rất ngắn (~200 từ)</option>
                    <option value="Trung bình (~400 từ)">Trung bình (~400 từ)</option>
                    <option value="Dài (~600 từ)">Dài (~600 từ)</option>
                    <option value="Rất dài (>800 từ)">Rất dài (&gt;800 từ)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Số lượng từ vựng</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={vocabCount}
                    onChange={e => setVocabCount(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  />
                </div>

                <div className="hidden md:block"></div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Số lượng câu hỏi</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-500 text-center leading-none">Trắc nghiệm</span>
                    <input type="number" min="0" max="20" className="w-14 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-white" value={mcqCount} onChange={e => setMcqCount(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-500 text-center leading-none">Nhiều đáp án</span>
                    <input type="number" min="0" max="20" className="w-14 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-white" value={mcqMultiCount} onChange={e => setMcqMultiCount(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-500 text-center leading-none">Đúng/Sai</span>
                    <input type="number" min="0" max="20" className="w-14 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-white" value={tfCount} onChange={e => setTfCount(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-500 text-center leading-none">Điền từ</span>
                    <input type="number" min="0" max="20" className="w-14 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-white" value={clozeCount} onChange={e => setClozeCount(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGeneratePrompt}
                className="w-full bg-indigo-600/90 backdrop-blur-md text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md mt-2 shrink-0"
              >
                <Wand2 className="w-5 h-5" />
                Tạo Prompt ✨
              </button>

              {generatedPrompt && (
                <div className="mt-2 relative animate-in fade-in duration-300 shrink-0">
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button onClick={handleCopyPrompt} className="bg-indigo-100/80 hover:bg-indigo-200 backdrop-blur-md text-indigo-700 dark:bg-indigo-900/80 dark:hover:bg-indigo-800 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm">
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                  </div>
                  <textarea 
                    readOnly 
                    className="w-full h-40 p-4 pt-12 text-[11px] font-mono border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl text-slate-700 dark:text-slate-300 custom-scrollbar resize-none outline-none"
                    value={generatedPrompt}
                  />
                </div>
              )}
            </div>

            {/* COLUMN 2: IMPORT RESULT */}
            <div className="flex flex-col gap-5 h-full">
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                Nhập kết quả từ AI
              </h4>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm leading-relaxed shrink-0">
                <p className="font-bold mb-1">💡 Hướng dẫn:</p>
                <p>1. <strong>Copy Prompt</strong> vừa tạo ở cột bên trái.</p>
                <p>2. Dán vào <a href="https://chat.openai.com" target="_blank" className="font-bold text-blue-600 underline">ChatGPT</a> hoặc Claude.</p>
                <p>3. Copy toàn bộ câu trả lời của AI và <strong>dán vào ô bên dưới</strong>.</p>
              </div>

              {errors.length > 0 && (
                <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl text-sm max-h-32 overflow-y-auto custom-scrollbar border border-red-100 shrink-0">
                  <p className="font-bold mb-1">❌ Lỗi phân tích:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <textarea
                className="w-full flex-1 min-h-[250px] p-4 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700 custom-scrollbar resize-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-200"
                placeholder="Dán nội dung bài học (.txt) trả về từ AI vào đây..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
              ></textarea>
              
              {loading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden shrink-0">
                  <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              <button 
                onClick={handleParseText}
                disabled={loading || !inputText.trim()}
                className="w-full bg-emerald-600/90 backdrop-blur-md text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý {progress}%...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    <span>Phân tích & Tạo bài học</span>
                  </>
                )}
              </button>
            </div>

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

