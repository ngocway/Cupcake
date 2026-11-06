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
 * Normalize Vietnamese class names (e.g. "45 Ngày Từ Vựng Cơ Bản", "45 Ngày Ngữ Pháp")
 * into 100% English titles for student reminder emails.
 */
export function formatEnglishClassName(rawClassName?: string, classCode?: string): string {
  const combined = `${rawClassName || ""} ${classCode || ""}`.toLowerCase()

  if (
    combined.includes("từ vựng") ||
    combined.includes("tu vung") ||
    combined.includes("vocab")
  ) {
    return "45-Day Vocabulary Challenge"
  }

  if (
    combined.includes("ngữ pháp") ||
    combined.includes("ngu phap") ||
    combined.includes("grammar")
  ) {
    return "45-Day Grammar Challenge"
  }

  const trimmed = (rawClassName || "").trim()
  if (!trimmed) return "45-Day English Challenge"

  // If the class name still contains Vietnamese diacritics, map to English challenge name
  const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)
  if (hasVietnameseChars) {
    return "45-Day English Challenge"
  }

  return trimmed
}

export function formatEnglishStudentName(rawName?: string): string {
  const trimmed = (rawName || "").trim()
  if (!trimmed || trimmed.toLowerCase() === "bạn nhỏ") {
    return "Learner"
  }
  return trimmed
}

/**
 * Generate Motivational 100% English HTML email template for Dolcake 45-Day Challenge (Option 3)
 */
export function generateInactiveReminderEmailHtml({
  studentName,
  className,
  classCode,
  classId,
  inactiveDays,
}: InactiveReminderEmailProps): string {
  const classUrl = `https://dolcake.com/student/classes/${classId}`
  const displayName = formatEnglishStudentName(studentName)
  const englishClassName = formatEnglishClassName(className, classCode)
  const daysNum = inactiveDays && inactiveDays > 0 ? inactiveDays : 3
  const daysText = `${daysNum} ${daysNum === 1 ? "day" : "days"}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Don't stop now, ${displayName}! Your 45-Day Challenge awaits</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; overflow: hidden; box-shadow: 0 16px 40px -10px rgba(15,23,42,0.1);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Energetic Header Banner -->
          <tr>
            <td style="padding: 38px 28px 28px; text-align: center; background: linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #4f46e5 100%);">
              <!-- Dolcake Mascot Icon -->
              <div style="display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 22px; line-height: 68px; text-align: center; font-size: 36px; box-shadow: 0 10px 24px rgba(0,0,0,0.18); margin-bottom: 14px;">
                🔥
              </div>
              <br>
              <!-- Brand Pill Badge -->
              <div style="display: inline-block; padding: 5px 14px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 12px;">
                45-DAY ENGLISH CHALLENGE
              </div>
              <!-- Header Title -->
              <h1 style="margin: 0; font-size: 23px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1.35; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                Just 5 minutes today to get back on track! 🏆
              </h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <!-- Greeting -->
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #0f172a;">
                Hi <strong style="color: #0284c7; font-size: 18px;">${displayName}</strong>, 👋
              </p>
              
              <!-- Inactive Alert Paragraph -->
              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #334155;">
                You've been away from <strong style="color: #0284c7;">${englishClassName}</strong> for <strong style="color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fecaca;">${daysText}</strong>. Every champion takes a short break—now is the best time to jump back in!
              </p>

              <!-- Motivation Highlight Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #86efac; border-radius: 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 22px 20px;">
                    <!-- Headline inside box -->
                    <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #166534; line-height: 1.55;">
                      ⚡ Here is what's waiting for you in today's lesson:
                    </p>

                    <!-- Feature Bullet 1 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #e0f2fe; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🎯
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #0369a1;">10-Minute Daily Mission:</strong> Quick, focused exercises designed so you never feel overwhelmed.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature Bullet 2 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #f3e8ff; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🎮
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #7e22ce;">Interactive Practice:</strong> Learn through flashcards, audio stories, and gamified quizzes.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature Bullet 3 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #ffedd5; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🌟
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #c2410c;">Instant Progress:</strong> Finish today's unit to unlock your next day in the 45-Day roadmap!
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Call to Action Note -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #0f172a; text-align: center; font-weight: 700;">
                Let's spend a few minutes completing your next unit today! 🚀
              </p>

              <!-- Big CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${classUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 360px; padding: 16px 28px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 50px; text-align: center; box-shadow: 0 10px 24px rgba(37,99,235,0.38); letter-spacing: 0.3px;">
                      🔥 Resume My 45-Day Challenge
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Wholesome Quote -->
              <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; font-style: italic;">
                "Consistency is the secret superpower of every great English learner! ✨"
              </p>
            </td>
          </tr>

          <!-- Light Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #64748b;">
                Warm regards,
              </p>
              <p style="margin: 0 0 14px; font-size: 14px; color: #0284c7; font-weight: 800;">
                The Dolcake Team 🧁
              </p>
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                This automated email was sent by <strong>Dolcake Learning Platform</strong> to help students stay on track with their 45-Day Challenge.
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
 * Send an inactive reminder email via Resend (100% English)
 */
export async function sendInactiveReminderEmail(props: InactiveReminderEmailProps) {
  const fromEmail = process.env.EMAIL_FROM || "Dolcake <onboarding@resend.dev>"
  const displayName = formatEnglishStudentName(props.studentName)
  const englishClassName = formatEnglishClassName(props.className, props.classCode)
  const html = generateInactiveReminderEmailHtml(props)
  const subject = `🔥 Don't stop now, ${displayName}! Your 45-Day Challenge awaits`

  if (!resend) {
    console.warn(
      `[Email Preview] RESEND_API_KEY is not set. Simulated sending to: ${props.studentEmail} (${displayName}) for class "${englishClassName}"`
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
 * Generate Friendly "We miss you!" English HTML email template for Teachers (Template 2)
 */
export function generateTeacherGameReminderEmailHtml({
  teacherName,
  inactiveDays = 7,
}: TeacherGameReminderEmailProps): string {
  const teacherUrl = "https://dolcake.com/teacher"
  const displayName = teacherName || "Teacher"
  const daysNum = inactiveDays && inactiveDays > 0 ? inactiveDays : 7
  const daysText = `${daysNum} ${daysNum === 1 ? "day" : "days"}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We miss you at Dolcake, ${displayName}! Ready for your next class game?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; overflow: hidden; box-shadow: 0 16px 40px -10px rgba(15,23,42,0.1);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Friendly Header Banner -->
          <tr>
            <td style="padding: 38px 28px 28px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%);">
              <div style="display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 22px; line-height: 68px; text-align: center; font-size: 34px; box-shadow: 0 10px 24px rgba(0,0,0,0.18); margin-bottom: 14px;">
                🧁
              </div>
              <br>
              <div style="display: inline-block; padding: 5px 14px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 12px;">
                DOLCAKE LEARNING
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1.35; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                Bring extra joy to your classroom this week! 🎉
              </h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <!-- Salutation -->
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #0f172a;">
                Hello <strong style="color: #4f46e5; font-size: 18px;">${displayName}</strong>, 👋
              </p>
              
              <!-- Inactive note -->
              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #334155;">
                We noticed you haven't visited <strong>Dolcake</strong> in the past <strong style="color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fecaca;">${daysText}</strong>, and we wanted to check in!
              </p>

              <!-- Game-based Learning Highlight Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); border: 1.5px solid #c4b5fd; border-radius: 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 22px 20px;">
                    <!-- Headline inside box -->
                    <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #4338ca; line-height: 1.55;">
                      Whether you're teaching new vocabulary, grammar, or quick math reflexes, our <strong>11 ready-to-play game templates</strong> help your students learn <span style="background: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 6px; font-weight: 800;">3x faster</span> while having fun together:
                    </p>

                    <!-- Feature 1: AI-Powered Creation -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #fdf2f8; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            ⚡
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #db2777;">AI-Powered Creation:</strong> Type a topic or paste a textbook photo to generate a full game instantly.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 2: Play Anywhere -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            📱
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #2563eb;">Play Anywhere:</strong> Works smoothly on Smartboards, iPads, and laptops via a simple link or QR code.
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 3: Built-in Native Audio & Illustrations -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 44px; vertical-align: middle;">
                          <div style="width: 36px; height: 36px; background-color: #ecfdf5; border-radius: 10px; line-height: 36px; text-align: center; font-size: 18px;">
                            🔊
                          </div>
                        </td>
                        <td style="padding-left: 10px; font-size: 14px; line-height: 1.5; color: #1e293b;">
                          <strong style="color: #059669;">Built-in Native Audio & Illustrations:</strong> Zero prep work needed before class.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Call to Action Note -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #0f172a; text-align: center; font-weight: 700;">
                Ready to surprise your students with a fun activity today? 🚀
              </p>

              <!-- Big CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${teacherUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 380px; padding: 16px 28px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 50px; text-align: center; box-shadow: 0 10px 24px rgba(124,58,237,0.38); letter-spacing: 0.3px;">
                      🎮 Explore Dolcake Teacher Studio
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Wholesome Quote -->
              <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; font-style: italic;">
                "5 minutes of prep for you — 45 minutes of excitement for your students! ✨"
              </p>
            </td>
          </tr>

          <!-- Light Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #64748b;">
                Warm regards,
              </p>
              <p style="margin: 0 0 14px; font-size: 14px; color: #4f46e5; font-weight: 800;">
                The Dolcake Team 🧁
              </p>
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                This automated email was sent by <strong>Dolcake Learning Platform</strong> to help teachers create engaging classroom experiences.
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
  const displayName = props.teacherName || "Teacher"
  const html = generateTeacherGameReminderEmailHtml(props)
  const subject = `🧁 We miss you at Dolcake, ${displayName}! Ready for your next class game?`

  if (!resend) {
    console.warn(
      `[Email Preview] RESEND_API_KEY is not set. Simulated sending to: ${props.teacherEmail} (${displayName})`
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
