'use strict';

function geminiResponseError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function finalModelOutputContent(payload, code) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw geminiResponseError('Gemini returned an invalid interaction.', code);
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, 'status')
    && payload.status !== 'completed'
  ) {
    throw geminiResponseError(
      `Gemini interaction has non-final status: ${String(payload.status)}.`,
      code,
    );
  }
  if (!Array.isArray(payload.steps)) {
    throw geminiResponseError('Gemini interaction has no steps.', code);
  }

  const modelOutputs = payload.steps.filter(
    (step) => step && step.type === 'model_output',
  );
  if (!modelOutputs.length) {
    throw geminiResponseError('Gemini interaction has no model output.', code);
  }
  const failedOutput = modelOutputs.find((step) => step.error);
  if (failedOutput) {
    throw geminiResponseError('Gemini model output contains an error.', code);
  }

  const content = modelOutputs[modelOutputs.length - 1].content;
  if (!Array.isArray(content)) {
    throw geminiResponseError('Gemini model output has no content.', code);
  }
  return content;
}

function extractInteractionText(payload, options = {}) {
  const code = options.code || 'gemini_interaction_invalid';
  const content = finalModelOutputContent(payload, code);
  const text = content
    .filter((block) => block && block.type === 'text')
    .map((block) => (typeof block.text === 'string' ? block.text : ''))
    .join('');
  if (!text.trim()) {
    throw geminiResponseError('Gemini model output has no text.', code);
  }
  return text;
}

function extractInteractionAudio(payload, options = {}) {
  const code = options.code || 'gemini_audio_invalid';
  const expectedMimeType = String(
    options.expectedMimeType || 'audio/l16',
  ).toLowerCase();
  const expectedSampleRate = options.expectedSampleRate || 24_000;
  const expectedChannels = options.expectedChannels || 1;
  const content = finalModelOutputContent(payload, code);
  const audioBlocks = content.filter(
    (block) => block && block.type === 'audio',
  );
  const audio = audioBlocks[audioBlocks.length - 1];
  if (!audio || typeof audio.data !== 'string' || !audio.data.trim()) {
    throw geminiResponseError('Gemini model output has no inline audio.', code);
  }

  const mimeType = String(audio.mime_type || expectedMimeType)
    .split(';')[0]
    .trim()
    .toLowerCase();
  const sampleRate = audio.sample_rate === undefined
    ? expectedSampleRate
    : audio.sample_rate;
  const channels = audio.channels === undefined
    ? expectedChannels
    : audio.channels;
  if (mimeType !== expectedMimeType) {
    throw geminiResponseError('Gemini returned an unexpected audio type.', code);
  }
  if (!Number.isInteger(sampleRate) || sampleRate !== expectedSampleRate) {
    throw geminiResponseError(
      'Gemini returned an unexpected audio sample rate.',
      code,
    );
  }
  if (!Number.isInteger(channels) || channels !== expectedChannels) {
    throw geminiResponseError(
      'Gemini returned an unexpected audio channel count.',
      code,
    );
  }

  return {
    data: audio.data,
    mimeType,
    sampleRate,
    channels,
  };
}

function buildEvidenceSources(inputData = {}) {
  const sources = ['title'];
  if (inputData.sectionText) sources.push('sectionText');
  if (inputData.context) sources.push('context');
  (inputData.mathLatex || []).forEach((unused, index) => {
    sources.push(`mathLatex[${index}]`);
  });
  (inputData.visuals || []).forEach((unused, index) => {
    sources.push(`visuals[${index}]`);
  });
  return sources;
}

function createSectionResponseSchema(inputData) {
  const evidenceSources = buildEvidenceSources(inputData);
  return {
    type: 'object',
    properties: {
      sectionType: { type: 'string' },
      evidence: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              enum: evidenceSources,
              description: `Sursa exactă trebuie să fie una dintre: ${evidenceSources.join(', ')}.`,
            },
            observation: { type: 'string' },
          },
          required: ['source', 'observation'],
        },
      },
      checks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string' },
            status: {
              type: 'string',
              enum: ['confirmed', 'incorrect', 'uncertain'],
            },
            explanation: { type: 'string' },
          },
          required: ['item', 'status', 'explanation'],
        },
      },
      transcript: { type: 'string' },
    },
    required: ['sectionType', 'evidence', 'checks', 'transcript'],
  };
}

module.exports = {
  buildEvidenceSources,
  createSectionResponseSchema,
  extractInteractionAudio,
  extractInteractionText,
};
