/**
 * Multi-source parsers for Specwright ingestion
 * Each parser normalizes raw input into a standard SourceDocument
 */

export interface SourceDocument {
  id: string;
  source_type: 'slack' | 'jira' | 'notion' | 'transcript';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  feature_id?: string;
}

// ─── Slack Parser ─────────────────────────────────────────────────────────────

export interface SlackInput {
  source_type: 'slack';
  channel: string;
  user: string;
  content: string;
  timestamp: string;
  thread_id?: string;
}

export function parseSlack(input: SlackInput): SourceDocument {
  if (!input.content?.trim()) {
    throw new Error('Slack message content is empty');
  }
  return {
    id: `slack-${input.timestamp}-${input.user}`,
    source_type: 'slack',
    content: input.content.trim(),
    metadata: {
      channel: input.channel,
      user: input.user,
      thread_id: input.thread_id,
    },
    timestamp: input.timestamp,
  };
}

// ─── Jira Parser ─────────────────────────────────────────────────────────────

export interface JiraInput {
  source_type: 'jira';
  ticket_id: string;
  title: string;
  description: string;
  priority: string;
  timestamp: string;
}

export function parseJira(input: JiraInput): SourceDocument {
  if (!input.ticket_id) throw new Error('Jira ticket_id is required');
  const content = [input.title, input.description].filter(Boolean).join('\n\n');
  return {
    id: `jira-${input.ticket_id}`,
    source_type: 'jira',
    content,
    metadata: {
      ticket_id: input.ticket_id,
      title: input.title,
      priority: input.priority,
    },
    timestamp: input.timestamp,
  };
}

// ─── Notion Parser ─────────────────────────────────────────────────────────────

export interface NotionInput {
  source_type: 'notion';
  page_id: string;
  title: string;
  content: string;
  timestamp: string;
}

export function parseNotion(input: NotionInput): SourceDocument {
  if (!input.page_id) throw new Error('Notion page_id is required');
  const content = [input.title, input.content].filter(Boolean).join('\n\n');
  return {
    id: `notion-${input.page_id}`,
    source_type: 'notion',
    content,
    metadata: {
      page_id: input.page_id,
      title: input.title,
    },
    timestamp: input.timestamp,
  };
}

// ─── Transcript Parser ─────────────────────────────────────────────────────────

export interface TranscriptInput {
  source_type: 'transcript';
  meeting_id: string;
  participants: string[];
  content: string;
  timestamp: string;
}

export function parseTranscript(input: TranscriptInput): SourceDocument {
  if (!input.meeting_id) throw new Error('Transcript meeting_id is required');
  if (!input.content?.trim()) throw new Error('Transcript content is empty');
  return {
    id: `transcript-${input.meeting_id}`,
    source_type: 'transcript',
    content: input.content.trim(),
    metadata: {
      meeting_id: input.meeting_id,
      participants: input.participants,
      participant_count: input.participants.length,
    },
    timestamp: input.timestamp,
  };
}

// ─── Generic Parser ────────────────────────────────────────────────────────────

export type AnyInput = SlackInput | JiraInput | NotionInput | TranscriptInput;

const VALID_SOURCE_TYPES = ['slack', 'jira', 'notion', 'transcript'] as const;

export function validateSourceType(source_type: string): source_type is typeof VALID_SOURCE_TYPES[number] {
  return VALID_SOURCE_TYPES.includes(source_type as any);
}

export function parseSource(input: AnyInput): SourceDocument {
  if (!validateSourceType(input.source_type)) {
    throw new Error(`Invalid source_type: ${(input as any).source_type}. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }
  switch (input.source_type) {
    case 'slack':      return parseSlack(input);
    case 'jira':       return parseJira(input);
    case 'notion':     return parseNotion(input);
    case 'transcript': return parseTranscript(input);
  }
}
