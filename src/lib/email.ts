import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
export const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface InactiveReminderEmailProps {
  studentName: string
  studentEmail: string
  className: string
  classCode: string
  classId: string
  inactiveDays: number
  streak?: number
}

/**
 * Generate Gamified, Child-friendly HTML email template for Dolcake
 */
export function generateInactiveReminderEmailHtml({
  studentName,
  className,
  classCode,
  classId,
  inactiveDays,
  streak = 0,
}: InactiveReminderEmailProps): string {
  const classUrl = `https://dolcake.com/student/classes/${classId}`
  const displayName = studentName || "bạn nhỏ"
  const daysText = inactiveDays ? `${inactiveDays} ngày` : "3 ngày"

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bé ơi, lớp học "${className}" đang đợi bé nè!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; overflow: hidden; box-shadow: 0 16px 40px -10px rgba(15,23,42,0.1);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Cheerful Colorful Header Banner -->
          <tr>
            <td style="padding: 38px 28px 28px; text-align: center; background: linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #4f46e5 100%);">
              <!-- Dolcake Mascot Icon -->
              <div style="display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 22px; line-height: 68px; text-align: center; font-size: 36px; box-shadow: 0 10px 24px rgba(0,0,0,0.18); margin-bottom: 14px;">
                🧁
              </div>
              <br>
              <!-- Brand Pill Badge -->
              <div style="display: inline-block; padding: 5px 14px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 12px;">
                DOLCAKE LEARNING
              </div>
              <!-- Header Title -->
              <h1 style="margin: 0; font-size: 23px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1.35; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                Bé ơi, lớp học "${className}" đang đợi bé nè! ✨
              </h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <!-- Greeting -->
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #0f172a;">
                Chào ba mẹ và bé <strong style="color: #0284c7; font-size: 18px;">${displayName}</strong>,
              </p>
              
              <!-- Inactive Alert Paragraph -->
              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #334155;">
                Đã <strong style="color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fecaca;">${daysText}</strong> rồi hệ thống Dolcake chưa thấy bé ghé thăm lớp học <strong style="color: #0284c7;">${className}</strong>. Thầy cô và các bạn đang rất nhớ bé đó!
              </p>

              <!-- Motivation Highlight Card ("Mầm Cây Nhỏ") -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #86efac; border-radius: 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 22px 20px;">
                    <!-- Headline inside box -->
                    <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #166534; line-height: 1.55;">
                      🌱 Học tiếng Anh giống như tưới nước cho một mầm cây nhỏ, chỉ cần bé dành <span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-weight: 800;">5 - 10 phút mỗi ngày</span>:
                    </p>

                    <!-- Feature Bullet 1 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #e0f2fe; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🃏
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #0369a1;">Lật các thẻ Flashcard</strong> từ vựng sinh động có âm thanh chuẩn bản xứ.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature Bullet 2 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #f3e8ff; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🎮
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #7e22ce;">Vượt qua các câu đố game vui nhộn</strong> của bài học.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature Bullet 3 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #ffedd5; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🔥
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #c2410c;">Tích lũy sao</strong> và giữ vững chuỗi học tập cùng cả lớp.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Call to Action Note -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #0f172a; text-align: center; font-weight: 700;">
                Ba mẹ hãy mở máy cho bé vào khám phá bài học ngày hôm nay nhé! 🚀
              </p>

              <!-- Big CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${classUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 360px; padding: 16px 28px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 50px; text-align: center; box-shadow: 0 10px 24px rgba(37,99,235,0.38); letter-spacing: 0.3px;">
                      🚀 Vào Lớp Học Của Bé Ngay
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Wholesome Quote -->
              <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; font-style: italic;">
                "Mỗi ngày một chút xíu thôi, bé sẽ tự tin nói tiếng Anh hơn mỗi ngày! 🌟"
              </p>
            </td>
          </tr>

          <!-- Light Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #64748b;">
                Thương mến,
              </p>
              <p style="margin: 0 0 14px; font-size: 14px; color: #0284c7; font-weight: 800;">
                Đội ngũ Dolcake & Thầy cô giáo 🧁
              </p>
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Email này được gửi tự động từ <strong>Dolcake Learning Platform</strong> nhằm hỗ trợ phụ huynh theo dõi tiến độ của học sinh.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Dolcake. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Send an inactive reminder email via Resend
 */
export async function sendInactiveReminderEmail(props: InactiveReminderEmailProps) {
  const fromEmail = process.env.EMAIL_FROM || "Dolcake <onboarding@resend.dev>"
  const html = generateInactiveReminderEmailHtml(props)
  const subject = `🧁 Bé ơi, lớp học "${props.className}" đang đợi bé nè!`

  if (!resend) {
    console.warn(
      `[Email Preview] RESEND_API_KEY is not set. Simulated sending to: ${props.studentEmail} (${props.studentName}) for class "${props.className}"`
    )
    return { success: true, simulated: true, id: `sim_${Date.now()}` }
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [props.studentEmail],
      subject,
      html,
    })

    return { success: true, id: data.data?.id }
  } catch (error: any) {
    console.error(`[Email Error] Failed to send to ${props.studentEmail}:`, error)
    return { success: false, error: error?.message || "Send email failed" }
  }
}

export interface TeacherGameReminderEmailProps {
  teacherName: string
  teacherEmail: string
  inactiveDays?: number
}

/**
 * Generate Inspiring, Teacher-Focused HTML email template for creating games in Dolcake
 */
export function generateTeacherGameReminderEmailHtml({
  teacherName,
  inactiveDays = 7,
}: TeacherGameReminderEmailProps): string {
  const teacherUrl = "https://dolcake.com/teacher"
  const displayName = teacherName || "Thầy/Cô"
  const daysText = inactiveDays ? `${inactiveDays} ngày` : "7 ngày"

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thầy/Cô ơi, học sinh đang mong chờ một mini-game vui nhộn từ Thầy/Cô nè! ✨</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; overflow: hidden; box-shadow: 0 16px 40px -10px rgba(15,23,42,0.1);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Inspiring Header Banner -->
          <tr>
            <td style="padding: 38px 28px 28px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%);">
              <div style="display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 22px; line-height: 68px; text-align: center; font-size: 34px; box-shadow: 0 10px 24px rgba(0,0,0,0.18); margin-bottom: 14px;">
                🎮
              </div>
              <br>
              <div style="display: inline-block; padding: 5px 14px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 12px;">
                DOLCAKE TEACHER STUDIO
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1.35; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                Thầy/Cô ơi, cùng tạo một Mini-Game bất ngờ cho học sinh tuần này nhé! ✨
              </h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <!-- Salutation -->
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #0f172a;">
                Kính gửi Thầy/Cô <strong style="color: #4f46e5; font-size: 18px;">${displayName}</strong>, 👋
              </p>
              
              <!-- Inactive note -->
              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #334155;">
                Đã <strong style="color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fecaca;">${daysText}</strong> rồi hệ thống Dolcake chưa thấy Thầy/Cô ghé qua góc sáng tạo lớp học. Các bạn nhỏ đang rất ngóng chờ một thử thách mới đầy hứng khởi từ Thầy/Cô đó ạ!
              </p>

              <!-- Game-based Learning Highlight Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); border: 1.5px solid #c4b5fd; border-radius: 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 22px 20px;">
                    <!-- Headline inside box -->
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #4338ca; line-height: 1.55;">
                      💡 Thầy/Cô có biết: Học sinh hào hứng và ghi nhớ từ vựng lâu gấp <span style="background: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 6px; font-weight: 800;">3 lần</span> khi được chơi mini-game tương tác?
                    </p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: #6366f1; font-weight: 600;">
                      Chỉ mất <strong style="color: #4338ca;">3 - 5 phút</strong>, Thầy/Cô có thể tạo ngay 4 tựa game hấp dẫn cho lớp:
                    </p>

                    <!-- Game 1: Candy Quiz -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #fdf2f8; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🍬
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #db2777;">Candy Quiz:</strong> Trả lời trắc nghiệm nhận kẹo ngọt, hiệu ứng rực rỡ, học sinh mê tít.
                        </td>
                      </tr>
                    </table>

                    <!-- Game 2: Choice Egg -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #fefce8; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🥚
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #ca8a04;">Đập Trứng Bí Mật (Choice Egg):</strong> Khám phá bí mật sau mỗi quả trứng, hồi hộp từng câu hỏi.
                        </td>
                      </tr>
                    </table>

                    <!-- Game 3: Treasure Hunt -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #ecfdf5; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🗺️
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #059669;">Truy Tìm Kho Báu (Treasure Hunt):</strong> Vượt chướng ngại vật cùng cả lớp, kích thích tinh thần đồng đội.
                        </td>
                      </tr>
                    </table>

                    <!-- Game 4: Shooter Quiz -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🎯
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #2563eb;">Bắn Bóng Từ Vựng (Shooter Quiz):</strong> Vừa rèn luyện phản xạ vừa ghi nhớ từ vựng cực vui.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Call to Action Note -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #0f172a; text-align: center; font-weight: 700;">
                Thầy/Cô hãy thử tạo ngay một mini-game vui vẻ cho bài học tuần này nhé! 🚀
              </p>

              <!-- Big CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${teacherUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 380px; padding: 16px 28px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 50px; text-align: center; box-shadow: 0 10px 24px rgba(124,58,237,0.38); letter-spacing: 0.3px;">
                      🎮 Vào Tạo Mini-Game Ngay (Chỉ 3 Phút)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Wholesome Quote -->
              <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; font-style: italic;">
                "Mỗi tiết học có mini-game là một ngày vui đến lớp của các con! 🌟"
              </p>
            </td>
          </tr>

          <!-- Light Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #64748b;">
                Trân trọng,
              </p>
              <p style="margin: 0 0 14px; font-size: 14px; color: #4f46e5; font-weight: 800;">
                Đội ngũ Sáng tạo & Hỗ trợ Giáo viên Dolcake 🧁
              </p>
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Email này được gửi tự động từ <strong>Dolcake Learning Platform</strong> nhằm hỗ trợ Thầy/Cô tối ưu hóa trải nghiệm giảng dạy.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Dolcake. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Send teacher game reminder email via Resend
 */
export async function sendTeacherGameReminderEmail(props: TeacherGameReminderEmailProps) {
  const fromEmail = process.env.EMAIL_FROM || "Dolcake <onboarding@resend.dev>"
  const html = generateTeacherGameReminderEmailHtml(props)
  const subject = `🎮 Thầy/Cô ơi, học sinh đang mong chờ một mini-game vui nhộn từ Thầy/Cô nè!`

  if (!resend) {
    console.warn(
      `[Email Preview] RESEND_API_KEY is not set. Simulated sending to: ${props.teacherEmail} (${props.teacherName})`
    )
    return { success: true, simulated: true, id: `sim_${Date.now()}` }
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [props.teacherEmail],
      subject,
      html,
    })

    return { success: true, id: data.data?.id }
  } catch (error: any) {
    console.error(`[Email Error] Failed to send to teacher ${props.teacherEmail}:`, error)
    return { success: false, error: error?.message || "Send email failed" }
  }
}

