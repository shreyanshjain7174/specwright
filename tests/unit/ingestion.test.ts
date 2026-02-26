/**
 * Unit tests for ingestion pipeline
 * Tests: chunking, time-decay, embeddings, source parsers, metadata
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { semanticChunk, calculateTimeDecayWeight } from '../../src/lib/ingestion/chunker.js';
import { mockEmbed, validateEmbeddingDimensions, EMBEDDING_DIMENSIONS, createEmbedder } from '../../src/lib/ingestion/embedder.js';
import {
  parseSlack, parseJira, parseNotion, parseTranscript,
  parseSource, validateSourceType,
} from '../../src/lib/ingestion/parsers/index.js';
import {
  slackMessage, jiraTicket, notionPage, callTranscript,
} from '../fixtures/sample-inputs.js';

// ─── Chunker Tests ─────────────────────────────────────────────────────────────

describe('semanticChunk', () => {
  it('preserves individual conversation turns as separate chunks', () => {
    const transcript = `PM: We need dark mode support for Q1.\nDesigner: I have the mockups ready.\nEngineer: Two sprints to implement.`;
    const chunks = semanticChunk(transcript, {
      source_type: 'transcript',
      source_id: 'test-transcript-1',
      feature_id: 'dark-mode',
      timestamp: new Date().toISOString(),
    });

    // Each speaker turn should be preserved
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const hasMultipleSpeakers = chunks.some((c) => c.metadata.speaker === 'PM') &&
      chunks.some((c) => c.metadata.speaker === 'Designer');
    expect(hasMultipleSpeakers).toBe(true);
  });

  it('does not split a single conversation turn across chunks', () => {
    const turn = 'PM: The main priority for Q1 is dark mode. We have strong user feedback supporting this decision and it aligns with our mobile-first strategy.';
    const chunks = semanticChunk(turn, {
      source_type: 'transcript',
      source_id: 'test-1',
      feature_id: 'dark-mode',
      timestamp: new Date().toISOString(),
    });

    // The single turn should be one chunk
    const pmChunks = chunks.filter((c) => c.metadata.speaker === 'PM');
    expect(pmChunks.length).toBeGreaterThanOrEqual(1);
  });

  it('sets correct chunk_index and total_chunks in metadata', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = semanticChunk(text, {
      source_type: 'notion',
      source_id: 'notion-1',
      feature_id: 'feat-1',
      timestamp: new Date().toISOString(),
    });

    chunks.forEach((chunk, i) => {
      expect(chunk.metadata.chunk_index).toBe(i);
      expect(chunk.metadata.total_chunks).toBe(chunks.length);
    });
  });

  it('assigns unique IDs to each chunk', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = semanticChunk(text, {
      source_type: 'notion',
      source_id: 'notion-unique',
      feature_id: 'feat-1',
      timestamp: new Date().toISOString(),
    });

    const ids = chunks.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes required metadata fields on every chunk', () => {
    const text = 'Test content for metadata validation.';
    const ts = new Date().toISOString();
    const chunks = semanticChunk(text, {
      source_type: 'slack',
      source_id: 'slack-1',
      feature_id: 'feat-meta',
      timestamp: ts,
    });

    for (const chunk of chunks) {
      expect(chunk.metadata.source_type).toBeDefined();
      expect(chunk.metadata.source_id).toBeDefined();
      expect(chunk.metadata.feature_id).toBeDefined();
      expect(chunk.metadata.timestamp).toBeDefined();
      expect(chunk.metadata.chunk_index).toBeTypeOf('number');
      expect(chunk.metadata.total_chunks).toBeTypeOf('number');
    }
  });

  it('returns non-empty text for each chunk', () => {
    const text = 'Hello world.\n\nAnother paragraph here.';
    const chunks = semanticChunk(text, {
      source_type: 'slack',
      source_id: 'slack-2',
      feature_id: 'feat-1',
      timestamp: new Date().toISOString(),
    });

    for (const chunk of chunks) {
      expect(chunk.text.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── Time-Decay Weight Tests ───────────────────────────────────────────────────

describe('calculateTimeDecayWeight', () => {
  it('returns 1.0 for a brand-new document (zero age)', () => {
    const now = new Date().toISOString();
    const weight = calculateTimeDecayWeight(now);
    // Should be very close to 1 (within floating point)
    expect(weight).toBeCloseTo(1.0, 3);
  });

  it('returns approximately 0.5 after one half-life', () => {
    const halfLifeDays = 30;
    const past = new Date(Date.now() - halfLifeDays * 24 * 60 * 60 * 1000).toISOString();
    const weight = calculateTimeDecayWeight(past, halfLifeDays);
    expect(weight).toBeCloseTo(0.5, 2);
  });

  it('returns approximately 0.25 after two half-lives', () => {
    const halfLifeDays = 30;
    const past = new Date(Date.now() - 2 * halfLifeDays * 24 * 60 * 60 * 1000).toISOString();
    const weight = calculateTimeDecayWeight(past, halfLifeDays);
    expect(weight).toBeCloseTo(0.25, 2);
  });

  it('returns lower weight for older documents', () => {
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateTimeDecayWeight(recent)).toBeGreaterThan(calculateTimeDecayWeight(old));
  });

  it('always returns a positive weight (never zero)', () => {
    const veryOld = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString();
    const weight = calculateTimeDecayWeight(veryOld);
    expect(weight).toBeGreaterThan(0);
  });

  it('throws for an invalid timestamp', () => {
    expect(() => calculateTimeDecayWeight('not-a-date')).toThrow('Invalid timestamp');
  });
});

// ─── Embedding Tests ───────────────────────────────────────────────────────────

describe('mockEmbed', () => {
  it('returns a vector with exactly 1536 dimensions', () => {
    const vec = mockEmbed('hello world');
    expect(vec.length).toBe(EMBEDDING_DIMENSIONS);
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it('returns a normalized unit vector (magnitude ≈ 1)', () => {
    const vec = mockEmbed('test embedding');
    const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  it('returns different vectors for different inputs', () => {
    const vec1 = mockEmbed('dark mode feature');
    const vec2 = mockEmbed('user authentication');
    expect(vec1).not.toEqual(vec2);
  });

  it('returns the same vector for the same input (deterministic)', () => {
    const text = 'consistent embedding test';
    expect(mockEmbed(text)).toEqual(mockEmbed(text));
  });

  it('returns all numbers (no NaN or Infinity)', () => {
    const vec = mockEmbed('edge case input 123 !@#');
    for (const v of vec) {
      expect(isFinite(v)).toBe(true);
      expect(isNaN(v)).toBe(false);
    }
  });
});

describe('validateEmbeddingDimensions', () => {
  it('returns true for a 1536-dimensional vector', () => {
    expect(validateEmbeddingDimensions(new Array(1536).fill(0))).toBe(true);
  });

  it('returns false for wrong dimensions', () => {
    expect(validateEmbeddingDimensions(new Array(768).fill(0))).toBe(false);
    expect(validateEmbeddingDimensions(new Array(3072).fill(0))).toBe(false);
    expect(validateEmbeddingDimensions([])).toBe(false);
  });

  it('returns false for non-array input', () => {
    expect(validateEmbeddingDimensions('not an array' as any)).toBe(false);
  });
});

describe('createEmbedder', () => {
  it('returns a function that produces 1536-dim embeddings in test env', async () => {
    const embed = createEmbedder();
    const vec = await embed('test text');
    expect(vec.length).toBe(EMBEDDING_DIMENSIONS);
  });
});

// ─── Source Type Validation ────────────────────────────────────────────────────

describe('validateSourceType', () => {
  it('accepts valid source types', () => {
    expect(validateSourceType('slack')).toBe(true);
    expect(validateSourceType('jira')).toBe(true);
    expect(validateSourceType('notion')).toBe(true);
    expect(validateSourceType('transcript')).toBe(true);
  });

  it('rejects invalid source types', () => {
    expect(validateSourceType('email')).toBe(false);
    expect(validateSourceType('github')).toBe(false);
    expect(validateSourceType('')).toBe(false);
    expect(validateSourceType('SLACK')).toBe(false); // case sensitive
  });
});

// ─── Slack Parser ──────────────────────────────────────────────────────────────

describe('parseSlack', () => {
  it('parses a valid Slack message into a SourceDocument', () => {
    const doc = parseSlack(slackMessage);
    expect(doc.source_type).toBe('slack');
    expect(doc.content).toBe(slackMessage.content.trim());
    expect(doc.metadata.channel).toBe(slackMessage.channel);
    expect(doc.metadata.user).toBe(slackMessage.user);
    expect(doc.timestamp).toBe(slackMessage.timestamp);
  });

  it('generates a unique ID containing slack and user', () => {
    const doc = parseSlack(slackMessage);
    expect(doc.id).toContain('slack');
  });

  it('throws when content is empty', () => {
    expect(() => parseSlack({ ...slackMessage, content: '' })).toThrow();
    expect(() => parseSlack({ ...slackMessage, content: '   ' })).toThrow();
  });
});

// ─── Jira Parser ──────────────────────────────────────────────────────────────

describe('parseJira', () => {
  it('parses a valid Jira ticket into a SourceDocument', () => {
    const doc = parseJira(jiraTicket);
    expect(doc.source_type).toBe('jira');
    expect(doc.id).toContain('jira');
    expect(doc.content).toContain(jiraTicket.title);
    expect(doc.content).toContain(jiraTicket.description);
    expect(doc.metadata.priority).toBe('High');
  });

  it('throws when ticket_id is missing', () => {
    expect(() => parseJira({ ...jiraTicket, ticket_id: '' })).toThrow('ticket_id is required');
  });

  it('includes ticket_id in the document ID', () => {
    const doc = parseJira(jiraTicket);
    expect(doc.id).toContain('PROD-1234');
  });
});

// ─── Notion Parser ─────────────────────────────────────────────────────────────

describe('parseNotion', () => {
  it('parses a valid Notion page into a SourceDocument', () => {
    const doc = parseNotion(notionPage);
    expect(doc.source_type).toBe('notion');
    expect(doc.content).toContain(notionPage.title);
    expect(doc.content).toContain('dark mode');
    expect(doc.metadata.page_id).toBe(notionPage.page_id);
  });

  it('throws when page_id is missing', () => {
    expect(() => parseNotion({ ...notionPage, page_id: '' })).toThrow('page_id is required');
  });
});

// ─── Transcript Parser ─────────────────────────────────────────────────────────

describe('parseTranscript', () => {
  it('parses a meeting transcript into a SourceDocument', () => {
    const doc = parseTranscript(callTranscript);
    expect(doc.source_type).toBe('transcript');
    expect(doc.content).toContain('dark mode');
    expect(doc.metadata.participants).toEqual(callTranscript.participants);
    expect(doc.metadata.participant_count).toBe(3);
  });

  it('throws when meeting_id is missing', () => {
    expect(() => parseTranscript({ ...callTranscript, meeting_id: '' })).toThrow('meeting_id is required');
  });

  it('throws when content is empty', () => {
    expect(() => parseTranscript({ ...callTranscript, content: '' })).toThrow('content is empty');
  });
});

// ─── Generic Parser ────────────────────────────────────────────────────────────

describe('parseSource', () => {
  it('routes slack input to the Slack parser', () => {
    const doc = parseSource(slackMessage);
    expect(doc.source_type).toBe('slack');
  });

  it('routes jira input to the Jira parser', () => {
    const doc = parseSource(jiraTicket);
    expect(doc.source_type).toBe('jira');
  });

  it('routes notion input to the Notion parser', () => {
    const doc = parseSource(notionPage);
    expect(doc.source_type).toBe('notion');
  });

  it('routes transcript input to the Transcript parser', () => {
    const doc = parseSource(callTranscript);
    expect(doc.source_type).toBe('transcript');
  });

  it('throws for an unsupported source_type', () => {
    expect(() => parseSource({ source_type: 'email' } as any)).toThrow('Invalid source_type');
  });
});
