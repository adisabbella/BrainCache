import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span style={styles.logoText}>BrainCache</span>
          </div>
          <button
            id="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={loggingOut ? { ...styles.logoutBtn, opacity: 0.6 } : styles.logoutBtn}
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.container}>
          {/* Welcome card */}
          <div style={styles.welcomeCard}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            </div>
            <h1 style={styles.welcome}>
              Welcome, <span style={styles.username}>{user?.username}</span>
            </h1>
            <p style={styles.authConfirm}>You are authenticated.</p>
            <p style={styles.emailBadge}>{user?.email}</p>
          </div>

          {/* Status cards */}
          <div style={styles.grid}>
            <div style={styles.statusCard}>
              <div style={styles.statusIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p style={styles.statusTitle}>Authentication</p>
                <p style={styles.statusDesc}>HTTP-only cookie active</p>
              </div>
            </div>

            <div style={styles.statusCard}>
              <div style={styles.statusIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p style={styles.statusTitle}>Session</p>
                <p style={styles.statusDesc}>Persists across refreshes</p>
              </div>
            </div>

            <div style={styles.statusCard}>
              <div style={styles.statusIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p style={styles.statusTitle}>Protected</p>
                <p style={styles.statusDesc}>Redirects when logged out</p>
              </div>
            </div>
          </div>

          <div style={styles.milestone}>
            <span style={styles.milestoneBadge}>Milestone 2 — Authentication ✓</span>
            <p style={styles.milestoneNote}>
              Content management will be added in Milestone 3.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f0f11',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: 'white',
  },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '1rem 1.5rem',
  },
  headerInner: {
    maxWidth: '48rem',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '0.4rem',
    backgroundColor: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'white',
    letterSpacing: '-0.02em',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.5rem',
    padding: '0.4rem 0.875rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
  },
  main: {
    padding: '4rem 1.5rem',
  },
  container: {
    maxWidth: '42rem',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center',
  },
  welcomeCard: {
    width: '100%',
    backgroundColor: '#17171a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1rem',
    padding: '2.5rem',
    textAlign: 'center',
  },
  avatarRing: {
    width: '5rem',
    height: '5rem',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
    boxShadow: '0 0 0 4px rgba(124,58,237,0.15)',
  },
  avatar: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'white',
  },
  welcome: {
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    marginBottom: '0.5rem',
  },
  username: {
    color: '#a78bfa',
  },
  authConfirm: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '0.75rem',
  },
  emailBadge: {
    display: 'inline-block',
    fontSize: '0.8125rem',
    color: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '9999px',
    padding: '0.25rem 0.875rem',
  },
  grid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  statusCard: {
    backgroundColor: '#17171a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '0.75rem',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  statusIcon: {
    width: '2rem',
    height: '2rem',
    borderRadius: '0.4rem',
    backgroundColor: 'rgba(52,211,153,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '0.125rem',
  },
  statusDesc: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.35)',
  },
  milestone: {
    textAlign: 'center',
    paddingTop: '0.5rem',
  },
  milestoneBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#a78bfa',
    backgroundColor: 'rgba(124,58,237,0.1)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: '9999px',
    padding: '0.25rem 0.875rem',
    marginBottom: '0.5rem',
  },
  milestoneNote: {
    fontSize: '0.8125rem',
    color: 'rgba(255,255,255,0.25)',
  },
};
