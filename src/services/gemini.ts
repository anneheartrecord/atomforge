import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL_NAME = 'gemini-2.5-pro-preview-05-06';

const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_SYSTEM_PROMPT = `You are an expert frontend developer. When asked to generate code, you MUST output a single, self-contained HTML file that includes all CSS (in a <style> tag) and JavaScript (in a <script> tag). The code must be immediately runnable in a browser iframe via srcdoc.

Rules:
- Always output complete, valid HTML5 with <!DOCTYPE html>
- Include all styles inline in <style> tags
- Include all scripts inline in <script> tags
- Use modern CSS (flexbox, grid, custom properties)
- Use vanilla JavaScript (ES2020+), no external dependencies unless loaded via CDN
- Make the UI responsive and visually polished
- Do NOT use any markdown code fences in your output — return raw HTML only
- If the user asks for a component or app, wrap it in a full HTML document`;

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
 * 流式生成代码
 */
export async function streamGenerateCode(
  prompt: string,
  onChunk: (text: string) => void,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: DEFAULT_SYSTEM_PROMPT,
  });

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
