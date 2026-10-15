import { toneMessage } from '../checkin';

describe('toneMessage', () => {
  it('says nothing about tone when there is no note', () => {
    expect(toneMessage({ mood: 'joy', note: null, detectedEmotion: null })).toBeNull();
  });

  it('agrees when the note matches the chosen mood', () => {
    expect(toneMessage({ mood: 'joy', note: 'great day', detectedEmotion: 'joy' })).toBe('Your note sounds joyful too.');
  });

  it('notes a different tone gently and keeps the chosen mood', () => {
    const msg = toneMessage({ mood: 'joy', note: 'fuck you', detectedEmotion: 'anger' })!;
    expect(msg).toContain('sounds more frustrated');
    expect(msg).toContain("We've kept Joyful as you chose");
  });

  it('is honest when the tone could not be read', () => {
    expect(toneMessage({ mood: 'neutral', note: 'hmm', detectedEmotion: null })).toMatch(/couldn't read the tone/);
  });
});
