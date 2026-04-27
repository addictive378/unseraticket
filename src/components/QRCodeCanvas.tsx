'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
    value: string;
    size?: number;
}

export default function QRCodeCanvas({ value, size = 140 }: QRCodeCanvasProps) {
    const [dataUrl, setDataUrl] = useState<string>('');

    useEffect(() => {
        QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
        }).then(setDataUrl).catch(err => {
            console.error('QR Code generation error:', err);
        });
    }, [value, size]);

    if (!dataUrl) return <div style={{ width: size, height: size, background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />;

    return (
        <img
            src={dataUrl}
            alt="QR Code"
            style={{
                borderRadius: '12px',
                width: '100%',
                maxWidth: size,
                height: 'auto',
                display: 'block'
            }}
        />
    );
}
