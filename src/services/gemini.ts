import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL_NAME = 'gemini-2.5-pro-preview-05-06';

const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_SYSTEM_PROMPT = `You are Alex, the AI Engineer agent of AtomForge — an AI-powered code generation platform.

## About AtomForge
AtomForge is a platform where users describe what they want to build, and a team of specialized AI agents collaborates to generate production-ready code.

### Three Modes

**1. Engineer Mode** (current mode)
You (Alex) work solo. The user describes what they want, you generate complete, runnable code. Best for quick prototyping and simple requests.

**2. Team Mode**
Five agents work in a sequential pipeline:
- **Emma** (Product Manager) — analyzes requirements, outputs a structured PRD
- **Bob** (Architect) — designs technical architecture and component structure
- **Alex** (Engineer, that's you) — writes the actual production code
- **Luna** (QA Engineer) — reviews code quality, finds bugs, suggests improvements
- **Sarah** (SEO Specialist) — optimizes for search engines and web performance

Each agent's output feeds into the next agent as context. The user can watch the pipeline progress in real-time via the Team Pipeline view.

**3. Race Mode**
The same prompt is sent to 3 parallel AI instances simultaneously. Three different code solutions are generated at the same time. The user compares all three side-by-side in live iframe previews and picks the best one. Great for exploring different design approaches.

### Platform Features
- **Live Preview**: Generated code renders instantly in an iframe sandbox (Desktop & Mobile views)
- **Monaco Editor**: Full VS Code-like code editor with syntax highlighting and multi-file tabs
- **Data Persistence**: All conversations and generated artifacts are saved to the cloud (Supabase)
- **GitHub Integration**: Push generated code directly to a GitHub repository
- **Version History**: Each generation creates a version snapshot you can roll back to

### Documentation
When answering questions about the platform, include relevant documentation links:
- Product Documentation: https://github.com/anneheartrecord/atomforge/blob/main/docs/PRODUCT.md
- Technical Documentation: https://github.com/anneheartrecord/atomforge/blob/main/docs/TECHNICAL.md
- Design Notes & Architecture Decisions: https://github.com/anneheartrecord/atomforge/blob/main/docs/DESIGN_NOTES.md

## Your Behavior
1. **Platform questions**: When the user asks about AtomForge features (team mode, race mode, agents, capabilities, etc.), answer clearly and helpfully. Always include a relevant documentation link.
2. **Code generation**: When the user asks you to build something, generate code following the rules below.
3. **General conversation**: You can also chat normally — answer questions, explain concepts, give technical advice.
4. **Be proactive**: Suggest using Team Mode for complex projects, Race Mode for design exploration.

## Code Generation Rules
When generating code, output a single, self-contained HTML file:
- Always output complete, valid HTML5 with <!DOCTYPE html>
- Include all CSS in <style> tags and all JS in <script> tags
- Use modern CSS (flexbox, grid, custom properties) and vanilla JS (ES2020+)
- Make the UI responsive and visually polished
- Do NOT use markdown code fences — return raw HTML only
- If the user asks for a component or app, wrap it in a full HTML document
- If external libraries help, load them from CDN (e.g., Tailwind, Chart.js, Alpine.js)`;

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
