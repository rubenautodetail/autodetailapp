import { ImageResponse } from 'next/og';

export const alt = 'DTailWash — Premium Mobile Car Detailing in Miami';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #131835 0%, #1c2350 100%)',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        fontSize: 30,
                        letterSpacing: 6,
                        textTransform: 'uppercase',
                        color: '#d4af6a',
                        marginBottom: 24,
                    }}
                >
                    Miami-Dade
                </div>
                <div style={{ fontSize: 76, fontWeight: 700, display: 'flex' }}>DTailWash</div>
                <div style={{ fontSize: 34, marginTop: 20, opacity: 0.85, display: 'flex' }}>
                    Premium Mobile Car Detailing
                </div>
            </div>
        ),
        { ...size }
    );
}
