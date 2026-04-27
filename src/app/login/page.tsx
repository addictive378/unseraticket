'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import styles from './auth.module.css';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in or just signed in
    useEffect(() => {
        if (status === 'authenticated' && session) {
            if (session.user?.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push(callbackUrl);
            }
            router.refresh();
        }
    }, [status, session, router, callbackUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (res?.error) {
                setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
                setLoading(false);
            }
            // If success, the useEffect above will handle redirection
            // once the session is updated by NextAuth
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.authBox} glass animate-fadeIn`}>
            <div className={styles.header}>
                <h1 className="gradient-text">Welcome Back</h1>
                <p>Login to access your tickets and bazar status.</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label><Mail size={16} /> Email Address</label>
                    <input
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label><Lock size={16} /> Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className={styles.options}>
                    <label className={styles.remember}>
                        <input type="checkbox" /> Remember me
                    </label>
                    <a href="#" className={styles.forgot}>Forgot password?</a>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <>SIGN IN <ArrowRight size={18} /></>}
                </button>
            </form>

            <div className={styles.footer}>
                <p>Don't have an account? <Link href="/signup">Create account</Link></p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className={styles.page}>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
