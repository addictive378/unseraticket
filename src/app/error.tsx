'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="glass p-8 rounded-2xl max-w-md w-full text-center border-white/10">
                <h2 className="text-3xl font-bold mb-4 gradient-text">Terjadi Kesalahan</h2>
                <p className="text-gray-400 mb-8">
                    Maaf, terjadi kesalahan saat memuat halaman ini. Kami telah mencatat masalah ini.
                </p>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => reset()}
                        className="btn-primary w-full"
                    >
                        Coba Lagi
                    </button>
                    <Link href="/" className="btn-outline w-full text-center">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
