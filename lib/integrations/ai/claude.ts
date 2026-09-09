import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Wrapper gọi Claude API thật (§1 quyết định nền tảng: "AI provider = Claude
 * (Anthropic)... dùng ANTHROPIC_API_KEY"). CHƯA có API key thật trong môi trường này
 * nên `askAssistant()` throw `AiNotConfiguredError` cho tới khi biến môi trường tồn
 * tại — cùng cách xử lý với 4 provider Ads ở Phase 6 (code thật, không giả lập trả
 * lời).
 */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("Chưa cấu hình ANTHROPIC_API_KEY — AI Command Center chưa hoạt động.");
    this.name = "AiNotConfiguredError";
  }
}

const MODEL = "claude-sonnet-5";

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Gọi Claude thật với system prompt (đã lọc theo RBAC ở tầng gọi — xem
 * services/ai/context.ts) + lịch sử hội thoại. Trả về text trả lời. */
export async function askAssistant(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

/** Tóm tắt 1 insight bằng ngôn ngữ tự nhiên — CHỈ dùng để làm mô tả dễ đọc hơn, số
 * liệu evidence thật đã được tính trước bằng heuristic (không phụ thuộc AI). Nếu
 * chưa cấu hình, trả về mô tả gốc (fallback an toàn, không throw để không chặn luồng
 * insight heuristic vốn không cần AI). */
export async function summarizeInsight(title: string, evidence: Record<string, unknown>): Promise<string | null> {
  if (!isAiConfigured()) return null;
  const prompt = `Tóm tắt ngắn gọn (2-3 câu, tiếng Việt) insight vận hành sau cho quản lý không chuyên kỹ thuật:\nTiêu đề: ${title}\nSố liệu: ${JSON.stringify(evidence)}`;
  return askAssistant("Bạn là trợ lý phân tích vận hành của VIMOVE OS. Trả lời ngắn gọn, cụ thể, dựa đúng số liệu được cung cấp — không suy diễn thêm.", [
    { role: "user", content: prompt },
  ]);
}
