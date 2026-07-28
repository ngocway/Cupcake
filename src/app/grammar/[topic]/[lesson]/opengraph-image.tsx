import { ImageResponse } from "next/og";
import { getTopicById, CEFR_LEVELS } from "@/lib/grammar-taxonomy";

export const runtime = "edge";
export const alt = "Grammar Lesson";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { topic: string; lesson: string };
}) {
  const { topic, lesson } = params;
  const topicCfg = getTopicById(topic);
  const lessonCfg = topicCfg?.lessons.find((l) => l.id === lesson);

  const lessonLabel = lessonCfg?.label ?? "Grammar Lesson";
  const topicLabel = topicCfg?.label ?? "English Grammar";
  const topicIcon = topicCfg?.icon ?? "📚";
  const level = lessonCfg?.level?.toUpperCase() ?? "";
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === lessonCfg?.level);

  // CEFR color map (inline for edge runtime)
  const levelColors: Record<string, { bg: string; text: string }> = {
    a1: { bg: "#d1fae5", text: "#065f46" },
    a2: { bg: "#e0f2fe", text: "#0c4a6e" },
    b1: { bg: "#fef3c7", text: "#78350f" },
    b2: { bg: "#ffedd5", text: "#7c2d12" },
    c1: { bg: "#ffe4e6", text: "#881337" },
  };
  const lc = levelColors[lessonCfg?.level ?? "a1"] ?? levelColors.a1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
          padding: "60px 80px",
          fontFamily: "'Segoe UI', Arial, sans-serif",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: 0, right: 0,
            width: 400, height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(134,239,172,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Dolcake brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{
            background: "#22c55e",
            borderRadius: 12,
            width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>
            🎂
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#15803d", letterSpacing: 1 }}>
            DOLCAKE
          </span>
          <span style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>· English Learning</span>
        </div>

        {/* Topic + Level badges */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <div style={{
            background: lc.bg,
            color: lc.text,
            borderRadius: 100,
            padding: "6px 18px",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 2,
          }}>
            {level}
          </div>
          <div style={{
            background: "#f1f5f9",
            color: "#475569",
            borderRadius: 100,
            padding: "6px 18px",
            fontSize: 16,
            fontWeight: 700,
          }}>
            {topicIcon} {topicLabel}
          </div>
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#1e293b",
          lineHeight: 1.1,
          marginBottom: 24,
          maxWidth: 800,
        }}>
          {lessonLabel}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 26,
          color: "#64748b",
          fontWeight: 500,
        }}>
          Grammar Guide · Rules, Examples & Practice Exercises
        </div>

        {/* Bottom bar */}
        <div style={{
          position: "absolute",
          bottom: 50,
          left: 80,
          right: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 28 }}>
            {["📐 Key Rules", "💬 Examples", "💡 Memory Tips", "❓ FAQ"].map((item) => (
              <span key={item} style={{ fontSize: 18, color: "#475569", fontWeight: 600 }}>
                {item}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 18, color: "#22c55e", fontWeight: 700 }}>
            dolcake.com/grammar
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
