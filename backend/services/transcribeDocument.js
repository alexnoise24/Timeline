import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

// JSON Schema for structured output — the API guarantees the response matches this shape
const EVENTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['events'],
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['time', 'title', 'description'],
        properties: {
          time: {
            type: 'string',
            description: '24h format HH:MM (e.g. "16:30"). Empty string if the document gives no time.'
          },
          title: {
            type: 'string',
            description: 'Short event name, in the same language as the document'
          },
          description: {
            type: 'string',
            description: 'Relevant details for the photo/video team (locations, people involved, notes). Empty string if none.'
          }
        }
      }
    }
  }
};

const PROMPT = `This PDF is a wedding planner's timeline/itinerary document. Extract the schedule as a list of events for a wedding photography & video team's coordination app.

Rules:
- Extract every scheduled moment relevant to photo/video coverage (getting ready, first look, ceremony, cocktail, reception, dances, toasts, cake, send-off, vendor arrivals that matter for coverage, etc.).
- Skip items with no photo/video relevance (e.g. catering prep counts, invoicing, internal vendor logistics with no visual moment).
- Keep titles and descriptions in the SAME language as the document (Spanish or English).
- Times in 24h HH:MM format. If an event has a range, use the start time. If no time is given, use an empty string.
- Preserve the document's chronological order.
- Do not invent events that are not in the document.`;

// Extracts timeline events from a PDF using the Claude API.
// Throws if ANTHROPIC_API_KEY is missing or the API call fails.
export async function transcribeDocumentPDF(filePath) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not configured on the server');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const client = new Anthropic();
  const pdfBase64 = fs.readFileSync(filePath).toString('base64');

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      format: { type: 'json_schema', schema: EVENTS_SCHEMA }
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
          },
          { type: 'text', text: PROMPT }
        ]
      }
    ]
  });

  if (response.stop_reason === 'refusal') {
    const err = new Error('The model declined to process this document');
    err.code = 'REFUSAL';
    throw err;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('No text content in model response');
  }

  const parsed = JSON.parse(textBlock.text);
  return {
    events: parsed.events,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    }
  };
}
