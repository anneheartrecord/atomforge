import type { AgentConfig, AgentRole } from '../types';
import { AGENT_PROMPTS } from './prompts';

export const AGENTS: AgentConfig[] = [
  {
    role: 'emma',
    name: 'Emma',
    title: '产品经理',
    description:
      '分析用户需求，输出结构化的产品需求文档（PRD），明确功能范围、用户故事和验收标准。',
    color: '#FF6B6B',
    avatar: '👩‍💼',
    systemPrompt: AGENT_PROMPTS.emma,
  },
  {
    role: 'bob',
    name: 'Bob',
    title: '架构师',
    description:
      '根据 PRD 设计技术架构，选择技术方案，规划组件结构和数据流。',
    color: '#4ECDC4',
    avatar: '👨‍💻',
    systemPrompt: AGENT_PROMPTS.bob,
  },
  {
    role: 'alex',
    name: 'Alex',
    title: '工程师',
    description:
      '根据技术架构编写完整、可运行的前端代码，输出单文件 HTML/CSS/JS。',
    color: '#4267FF',
    avatar: '🧑‍🔧',
    systemPrompt: AGENT_PROMPTS.alex,
  },
  {
    role: 'luna',
    name: 'Luna',
    title: '测试员',
    description:
      '审查代码质量，发现 bug、性能问题和可访问性问题，给出改进建议。',
    color: '#FFE66D',
    avatar: '🧪',
    systemPrompt: AGENT_PROMPTS.luna,
  },
  {
    role: 'sarah',
    name: 'Sarah',
    title: 'SEO 专家',
    description:
      '分析页面的搜索引擎优化状况，给出 meta 标签、语义化和性能方面的建议。',
    color: '#A78BFA',
    avatar: '📊',
    systemPrompt: AGENT_PROMPTS.sarah,
  },
];

export function getAgent(role: AgentRole): AgentConfig {
  const agent = AGENTS.find((a) => a.role === role);
  if (!agent) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return agent;
}
