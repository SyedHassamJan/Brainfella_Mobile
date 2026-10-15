import { absoluteApiUrl, whatsappLink } from '../whatsapp';

describe('whatsappLink', () => {
  it('builds a wa.me link with digits only and an encoded greeting', () => {
    const url = whatsappLink('+92 300-1234567', 'Dr Ayesha');
    expect(url.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1]!)).toContain('Hello Dr Ayesha');
  });
});

describe('absoluteApiUrl', () => {
  it('prefixes API paths and passes through empty values', () => {
    expect(absoluteApiUrl('/therapist/abc/photo')).toMatch(/^https?:\/\/.+\/therapist\/abc\/photo$/);
    expect(absoluteApiUrl(null)).toBeNull();
    expect(absoluteApiUrl(undefined)).toBeNull();
  });
});
