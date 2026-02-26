/**
 * Shared types for the agent system
 */

export interface ReasoningStep {
  thought: string;
  action: string;
  action_input: unknown;
  observation?: string;
}

export interface AgentTrace {
  agent_id: string;
  session_id: string;
  steps: ReasoningStep[];
  final_answer: unknown;
  duration_ms: number;
}

export interface ContextChunk {
  id: string;
  text: string;
  score: number; // relevance score 0-1
  metadata: Record<string, unknown>;
}

export interface EvidenceGrounding {
  requirement_id: string;
  evidence: ContextChunk[];
  confidence: number;
}
