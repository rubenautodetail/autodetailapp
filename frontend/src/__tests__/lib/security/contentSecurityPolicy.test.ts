import { CONTENT_SECURITY_POLICY } from '@/lib/security/contentSecurityPolicy';

const directive = (name: string) =>
  CONTENT_SECURITY_POLICY.split('; ').find((value) => value.startsWith(`${name} `));

describe('Content Security Policy', () => {
  it('allows Google Analytics scripts and telemetry', () => {
    expect(directive('script-src')).toContain('https://www.googletagmanager.com');
    expect(directive('connect-src')).toContain('https://*.google-analytics.com');
    expect(directive('connect-src')).toContain('https://*.analytics.google.com');
    expect(directive('img-src')).toContain('https://*.google-analytics.com');
  });

  it('allows Microsoft Clarity scripts and telemetry', () => {
    expect(directive('script-src')).toContain('https://www.clarity.ms');
    expect(directive('connect-src')).toContain('https://*.clarity.ms');
    expect(directive('connect-src')).toContain('https://c.bing.com');
    expect(directive('img-src')).toContain('https://*.clarity.ms');
    expect(directive('img-src')).toContain('https://c.bing.com');
  });

  it('does not broadly allow every HTTPS origin', () => {
    expect(CONTENT_SECURITY_POLICY.split(/\s+/)).not.toContain('https:');
  });
});
