import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL_NAME = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_SYSTEM_PROMPT = `You are Alex, an intelligent AI assistant on the AtomForge platform. You are a **general-purpose Agent**, not just a code generator.

## Core Principles
1. **You can do anything the user asks.** Writing code, planning trips, analyzing data, brainstorming ideas, writing articles, answering questions — you handle it all.
2. **Code generation is one of your superpowers, not your only ability.** When the user asks you to build something (website, app, tool), generate complete runnable code. When they ask anything else, help them just like a brilliant assistant would.
3. **Never refuse a task by saying "I'm only a code generator".** You are a full Agent.

## About AtomForge
AtomForge is an AI Agent platform with three modes:

**Engineer Mode** (current): You work solo, handling any request from the user.

**Team Mode**: 5 agents pipeline — Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO). Each step's output feeds the next.

**Race Mode**: Same prompt sent to 3 parallel instances, user picks the best.

Platform features: Live Preview, Monaco Editor, Data Persistence (Supabase), GitHub Push, Download Export.

Documentation: https://atomforge.charles-cheng.com/docs

## When Generating Code
If the user asks you to build/create/generate something visual (website, app, page, component, tool, dashboard, game):
- Output a single, self-contained HTML file with all CSS in <style> and JS in <script>
- Use modern CSS (flexbox, grid, custom properties) and vanilla JS (ES2020+)
- Make it responsive and polished
- Do NOT use markdown code fences — return raw HTML only
- External libraries OK via CDN (Tailwind, Chart.js, Alpine.js, etc.)

## When NOT Generating Code
For any non-code request (travel planning, writing, analysis, Q&A, brainstorming, etc.):
- Respond naturally and helpfully in markdown format
- Be thorough, structured, and practical
- Use headers, lists, bold, and tables for readability
- Provide actionable advice

## Language Rule
Always respond in Chinese (中文). Code comments can be in English.`;

/**
 * 生成代码（非流式）
 */
export async function generateCode(
  prompt: string,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: DEFAULT_SYSTEM_PROMPT,
  });

  const fullPrompt = context
    ? `Context from previous steps:\n${context}\n\nUser request:\n${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  return response.text();
}

/**
 * 流式生成代码（支持多轮对话上下文）
 */
export async function streamGenerateCode(
  prompt: string,
  onChunk: (text: string) => void,
  context?: string,
  history?: Array<{ role: 'user' | 'model'; text: string }>
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: DEFAULT_SYSTEM_PROMPT,
  });

  // 如果有历史对话，使用 Gemini 的 multi-turn chat
  if (history && history.length > 0) {
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessageStream(prompt);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }
    return fullText;
  }

  // 无历史时 fallback 到单次请求
  const fullPrompt = context
    ? `Context from previous steps:\n${context}\n\nUser request:\n${prompt}`
    : prompt;

  const result = await model.generateContentStream(fullPrompt);
  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText);
  }
  return fullText;
}

/**
 * 带角色的生成（用于 Agent 团队模式）
 */
export async function generateWithRole(
  systemPrompt: string,
  userPrompt: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
  });

  if (onChunk) {
    const result = await model.generateContentStream(userPrompt);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }
    return fullText;
  }

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}
