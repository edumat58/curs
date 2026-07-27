'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildEvidenceSources,
  createSectionResponseSchema,
  extractInteractionAudio,
  extractInteractionText,
} = require('./edupasi-gemini');

function modelOutput(content, extra = {}) {
  return {
    type: 'model_output',
    content,
    ...extra,
  };
}

test('extractInteractionText accepts a missing status and joins text blocks', () => {
  const result = extractInteractionText({
    steps: [
      {type: 'thought', summary: [{type: 'text', text: 'internal'}]},
      modelOutput([
        {type: 'text', text: '{"answer":'},
        {type: 'text', text: '"corect"}'},
      ]),
    ],
  });
  assert.equal(result, '{"answer":"corect"}');
});

test('extractInteractionText accepts completed status', () => {
  const result = extractInteractionText({
    status: 'completed',
    steps: [modelOutput([{type: 'text', text: 'gata'}])],
  });
  assert.equal(result, 'gata');
});

test('extractInteractionText rejects a non-final interaction status', () => {
  assert.throws(
    () => extractInteractionText(
      {
        status: 'in_progress',
        steps: [modelOutput([{type: 'text', text: 'parțial'}])],
      },
      {code: 'section_provider_invalid'},
    ),
    (error) => error.code === 'section_provider_invalid'
      && /non-final status/.test(error.message),
  );
});

test('extractInteractionText rejects a model output error', () => {
  assert.throws(
    () => extractInteractionText(
      {
        status: 'completed',
        steps: [
          modelOutput(
            [{type: 'text', text: 'never used'}],
            {error: {code: 13, message: 'provider failure'}},
          ),
        ],
      },
      {code: 'section_provider_invalid'},
    ),
    (error) => error.code === 'section_provider_invalid'
      && /contains an error/.test(error.message),
  );
});

test('extractInteractionText uses the final model output', () => {
  const result = extractInteractionText({
    status: 'completed',
    steps: [
      modelOutput([{type: 'text', text: 'prima versiune'}]),
      modelOutput([{type: 'text', text: 'versiunea finală'}]),
    ],
  });
  assert.equal(result, 'versiunea finală');
});

test('extractInteractionAudio returns validated inline PCM metadata', () => {
  const result = extractInteractionAudio({
    status: 'completed',
    steps: [
      modelOutput([{
        type: 'audio',
        data: 'AAECAw==',
        mime_type: 'audio/l16',
        sample_rate: 24_000,
        channels: 1,
      }]),
    ],
  });
  assert.deepEqual(result, {
    data: 'AAECAw==',
    mimeType: 'audio/l16',
    sampleRate: 24_000,
    channels: 1,
  });
});

test('extractInteractionAudio applies requested defaults to optional metadata', () => {
  const result = extractInteractionAudio({
    steps: [modelOutput([{type: 'audio', data: 'AAECAw=='}])],
  });
  assert.equal(result.mimeType, 'audio/l16');
  assert.equal(result.sampleRate, 24_000);
  assert.equal(result.channels, 1);
});

test('extractInteractionAudio rejects unexpected format metadata', async (t) => {
  const cases = [
    ['MIME type', {mime_type: 'audio/wav'}],
    ['sample rate', {sample_rate: 16_000}],
    ['channels', {channels: 2}],
  ];
  for (const [name, override] of cases) {
    await t.test(name, () => {
      assert.throws(
        () => extractInteractionAudio(
          {
            status: 'completed',
            steps: [
              modelOutput([{
                type: 'audio',
                data: 'AAECAw==',
                mime_type: 'audio/l16',
                sample_rate: 24_000,
                channels: 1,
                ...override,
              }]),
            ],
          },
          {code: 'speech_audio_invalid'},
        ),
        (error) => error.code === 'speech_audio_invalid'
          && /unexpected audio/.test(error.message),
      );
    });
  }
});

test('evidence schema exposes only sources present in the request', () => {
  const input = {
    sectionText: 'Text',
    context: '',
    mathLatex: ['x^2', 'y^2'],
    visuals: [{data: 'one'}],
  };
  const expected = [
    'title',
    'sectionText',
    'mathLatex[0]',
    'mathLatex[1]',
    'visuals[0]',
  ];
  assert.deepEqual(buildEvidenceSources(input), expected);

  const schema = createSectionResponseSchema(input);
  assert.deepEqual(
    schema.properties.evidence.items.properties.source.enum,
    expected,
  );
  assert.equal(schema.properties.evidence.minItems, 1);
  assert.equal(schema.properties.checks.minItems, 1);
});
