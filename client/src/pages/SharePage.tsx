import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedContent } from '../services/content';
import type { PublicContentItem } from '../services/content';

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [item, setItem] = useState<PublicContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link.');
      setLoading(false);
      return;
    }
    getSharedContent(token).then(({ data, error: err }) => {
      if (err) setError(err);
      else setItem(data);
      setLoading(false);
    });
  }, [token]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span style={s.logoText}>BrainCache</span>
        </div>
        <span style={s.sharedLabel}>Shared Link</span>
      </header>

      <main style={s.main}>
        <div style={s.container}>
          {loading && <p style={s.muted}>Loading shared content…</p>}

          {!loading && error && (
            <div style={s.errorBox}>
              <p style={s.errorTitle}>Content not available</p>
              <p style={s.muted}>
                This link may be invalid, expired, or sharing may have been disabled.
              </p>
            </div>
          )}

          {!loading && item && (
            <div style={s.card}>
              {item.thumbnailUrl && (
                <img
                  src={item.thumbnailUrl}
                  alt="Preview"
                  style={s.thumbnail}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}

              <div style={s.cardMeta}>
                <span style={s.categoryBadge}>{item.category}</span>
                {item.domain && <span style={s.domain}>{item.domain}</span>}
              </div>

              {item.title && <h1 style={s.title}>{item.title}</h1>}

              {item.description && <p style={s.description}>{item.description}</p>}

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
                id="shared-content-url"
              >
                {item.url}
              </a>

              {item.tags.length > 0 && (
                <div style={s.tagList}>
                  {item.tags.map((tag) => (
                    <span key={tag} style={s.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <p style={s.footer}>
                Shared via <strong>BrainCache</strong> — save links, never lose them.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#0f0f11', fontFamily: 'Inter, system-ui, sans-serif', color: 'white' },
  header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoIcon: { width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '0.875rem', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' },
  sharedLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', padding: '0.2rem 0.6rem' },
  main: { padding: '3rem 1.5rem' },
  container: { maxWidth: '42rem', margin: '0 auto' },
  card: { backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  thumbnail: { width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '0.5rem' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  categoryBadge: { fontSize: '0.75rem', fontWeight: 500, color: '#a78bfa', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '9999px', padding: '0.15rem 0.6rem' },
  domain: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' },
  title: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.3 },
  description: { fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 },
  link: { fontSize: '0.875rem', color: '#818cf8', textDecoration: 'none', wordBreak: 'break-all' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '0.375rem' },
  tag: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '9999px', padding: '0.1rem 0.5rem' },
  footer: { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)', margin: 0, paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' },
  muted: { fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', margin: 0 },
  errorBox: { textAlign: 'center', padding: '4rem 1rem' },
  errorTitle: { fontSize: '1.125rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' },
};
