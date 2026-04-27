import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="glass p-8 rounded-2xl max-w-md w-full text-center border-white/10">
                <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
                <h2 className="text-2xl font-semibold mb-4">Halaman Tidak Ditemukan</h2>
                <p className="text-gray-400 mb-8">
                    Maaf, halaman yang Anda cari mungkin telah dipindahkan atau belum pernah ada.
                </p>
                <Link href="/" className="btn-primary inline-block">
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
