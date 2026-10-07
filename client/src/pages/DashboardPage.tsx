import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../services/content';
import { CATEGORIES } from '../types/content';
import type { ContentItem, UpdateContentBody } from '../types/content';

// ── Types ────────────────────────────────────────────────────────────────────

type ViewState = 'list' | 'add' | 'edit';

// ── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [view, setView] = useState<ViewState>('list');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Load content ────────────────────────────────────────────────────────────
  async function fetchContent() {
    setLoadingList(true);
    setListError(null);
    const { data, error } = await contentApi.list();
    if (error) {
      setListError(error);
    } else {
      setItems(data?.items ?? []);
    }
    setLoadingList(false);
  }

  useEffect(() => {
    void fetchContent();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  }

  function handleEdit(item: ContentItem) {
    setEditingItem(item);
    setView('edit');
  }

  async function handleDelete(id: string) {
    const { error } = await contentApi.delete(id);
    if (error) {
      alert(`Delete failed: ${error}`);
      return;
    }
    setDeleteConfirmId(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSaved(item: ContentItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    setView('list');
    setEditingItem(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span style={s.logoText}>BrainCache</span>
          </div>
          <div style={s.headerRight}>
            <span style={s.userBadge}>{user?.username}</span>
            {view === 'list' && (
              <button id="add-content-btn" onClick={() => setView('add')} style={s.primaryBtn}>
                + Save URL
              </button>
            )}
            {view !== 'list' && (
              <button id="back-btn" onClick={() => { setView('list'); setEditingItem(null); }} style={s.secondaryBtn}>
                ← Back
              </button>
            )}
            <button id="logout-button" onClick={handleLogout} disabled={loggingOut} style={s.logoutBtn}>
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={s.main}>
        <div style={s.container}>
          {view === 'list' && (
            <ContentList
              items={items}
              loading={loadingList}
              error={listError}
              onRetry={fetchContent}
              onEdit={handleEdit}
              onDeleteRequest={(id) => setDeleteConfirmId(id)}
              deleteConfirmId={deleteConfirmId}
              onDeleteConfirm={handleDelete}
              onDeleteCancel={() => setDeleteConfirmId(null)}
            />
          )}

          {view === 'add' && (
            <SaveForm onSaved={handleSaved} onCancel={() => setView('list')} />
          )}

          {view === 'edit' && editingItem && (
            <EditForm
              item={editingItem}
              onSaved={handleSaved}
              onCancel={() => { setView('list'); setEditingItem(null); }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Content List ──────────────────────────────────────────────────────────────

function ContentList({
  items,
  loading,
  error,
  onRetry,
  onEdit,
  onDeleteRequest,
  deleteConfirmId,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  items: ContentItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (item: ContentItem) => void;
  onDeleteRequest: (id: string) => void;
  deleteConfirmId: string | null;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  if (loading) return <p style={s.muted}>Loading your content…</p>;
  if (error) return (
    <div style={s.errorBox}>
      <p>{error}</p>
      <button onClick={onRetry} style={s.secondaryBtn}>Retry</button>
    </div>
  );
  if (items.length === 0) return (
    <div style={s.emptyState}>
      <p style={s.emptyTitle}>Your BrainCache is empty.</p>
      <p style={s.muted}>Click <strong>+ Save URL</strong> to add your first link.</p>
    </div>
  );

  return (
    <div style={s.list}>
      {items.map((item) => (
        <div key={item.id} style={s.card}>
          <div style={s.cardTop}>
            <div style={s.cardMeta}>
              <span style={s.categoryBadge}>{item.category}</span>
              {item.domain && <span style={s.domain}>{item.domain}</span>}
            </div>
            <div style={s.cardActions}>
              <button
                id={`edit-btn-${item.id}`}
                onClick={() => onEdit(item)}
                style={s.iconBtn}
                title="Edit"
              >
                ✏️
              </button>
              <button
                id={`delete-btn-${item.id}`}
                onClick={() => onDeleteRequest(item.id)}
                style={{ ...s.iconBtn, color: '#f87171' }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>

          {item.title && <p style={s.cardTitle}>{item.title}</p>}

          <a href={item.url} target="_blank" rel="noopener noreferrer" style={s.cardUrl}>
            {item.url.length > 80 ? item.url.slice(0, 80) + '…' : item.url}
          </a>

          {item.tags.length > 0 && (
            <div style={s.tagList}>
              {item.tags.map((tag) => (
                <span key={tag} style={s.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {item.note && <p style={s.note}>📝 {item.note}</p>}

          <p style={s.timestamp}>
            Saved {new Date(item.createdAt).toLocaleDateString()}
          </p>

          {deleteConfirmId === item.id && (
            <div style={s.confirmRow}>
              <span style={{ color: '#f87171', fontSize: '0.875rem' }}>Delete this item?</span>
              <button
                id={`confirm-delete-btn-${item.id}`}
                onClick={() => onDeleteConfirm(item.id)}
                style={{ ...s.secondaryBtn, color: '#f87171', borderColor: '#f87171' }}
              >
                Yes, delete
              </button>
              <button onClick={onDeleteCancel} style={s.secondaryBtn}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Save Form ─────────────────────────────────────────────────────────────────

function SaveForm({
  onSaved,
  onCancel,
}: {
  onSaved: (item: ContentItem) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [tagsRaw, setTagsRaw] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error: apiError } = await contentApi.create({
      url: url.trim(),
      title: title.trim() || undefined,
      category,
      tags,
      note: note.trim() || undefined,
    });

    setSubmitting(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data?.item) {
      onSaved(data.item);
    }
  }

  return (
    <div style={s.formCard}>
      <h2 style={s.formTitle}>Save a URL</h2>
      <form onSubmit={handleSubmit} style={s.form}>
        <FormField label="URL *" htmlFor="save-url">
          <input
            id="save-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            required
            style={s.input}
          />
        </FormField>

        <FormField label="Title" htmlFor="save-title">
          <input
            id="save-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            style={s.input}
          />
        </FormField>

        <FormField label="Category *" htmlFor="save-category">
          <select
            id="save-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={s.input}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Tags (comma-separated)" htmlFor="save-tags">
          <input
            id="save-tags"
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="machine-learning, tutorial"
            style={s.input}
          />
        </FormField>

        <FormField label="Note" htmlFor="save-note">
          <textarea
            id="save-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Personal note…"
            rows={3}
            style={{ ...s.input, resize: 'vertical' }}
          />
        </FormField>

        {error && <p style={s.fieldError}>{error}</p>}

        <div style={s.btnRow}>
          <button id="submit-save-btn" type="submit" disabled={submitting} style={s.primaryBtn}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} style={s.secondaryBtn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Edit Form ─────────────────────────────────────────────────────────────────

function EditForm({
  item,
  onSaved,
  onCancel,
}: {
  item: ContentItem;
  onSaved: (item: ContentItem) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? '');
  const [category, setCategory] = useState<string>(item.category);
  const [tagsRaw, setTagsRaw] = useState(item.tags.join(', '));
  const [note, setNote] = useState(item.note ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const body: UpdateContentBody = { category, tags };
    if (title.trim()) body.title = title.trim();
    if (note.trim()) body.note = note.trim();

    const { data, error: apiError } = await contentApi.update(item.id, body);

    setSubmitting(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data?.item) {
      onSaved(data.item);
    }
  }

  return (
    <div style={s.formCard}>
      <h2 style={s.formTitle}>Edit Content</h2>
      <p style={s.muted}>{item.url}</p>
      <form onSubmit={handleSubmit} style={s.form}>
        <FormField label="Title" htmlFor="edit-title">
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            style={s.input}
          />
        </FormField>

        <FormField label="Category *" htmlFor="edit-category">
          <select
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={s.input}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Tags (comma-separated)" htmlFor="edit-tags">
          <input
            id="edit-tags"
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="machine-learning, tutorial"
            style={s.input}
          />
        </FormField>

        <FormField label="Note" htmlFor="edit-note">
          <textarea
            id="edit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Personal note…"
            rows={3}
            style={{ ...s.input, resize: 'vertical' }}
          />
        </FormField>

        {error && <p style={s.fieldError}>{error}</p>}

        <div style={s.btnRow}>
          <button id="submit-edit-btn" type="submit" disabled={submitting} style={s.primaryBtn}>
            {submitting ? 'Saving…' : 'Update'}
          </button>
          <button type="button" onClick={onCancel} style={s.secondaryBtn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={s.field}>
      <label htmlFor={htmlFor} style={s.label}>{label}</label>
      {children}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#0f0f11', fontFamily: 'Inter, system-ui, sans-serif', color: 'white' },
  header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.5rem' },
  headerInner: { maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoIcon: { width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '0.875rem', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  userBadge: { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginRight: '0.25rem' },
  primaryBtn: { backgroundColor: '#7c3aed', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, color: 'white', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' },
  main: { padding: '2rem 1.5rem' },
  container: { maxWidth: '56rem', margin: '0 auto' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  categoryBadge: { fontSize: '0.75rem', fontWeight: 500, color: '#a78bfa', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '9999px', padding: '0.15rem 0.6rem' },
  domain: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' },
  cardActions: { display: 'flex', gap: '0.25rem' },
  iconBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: '0.375rem' },
  cardTitle: { fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  cardUrl: { fontSize: '0.8125rem', color: '#818cf8', textDecoration: 'none', wordBreak: 'break-all' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '0.375rem' },
  tag: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '9999px', padding: '0.1rem 0.5rem' },
  note: { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: 0 },
  timestamp: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', margin: 0 },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' },
  emptyState: { textAlign: 'center', padding: '4rem 1rem' },
  emptyTitle: { fontSize: '1.125rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' },
  muted: { fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', margin: 0 },
  errorBox: { backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', color: '#f87171' },
  formCard: { backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '2rem', maxWidth: '36rem', margin: '0 auto' },
  formTitle: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '1.5rem', marginTop: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' },
  input: { backgroundColor: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'white', width: '100%', boxSizing: 'border-box' },
  fieldError: { fontSize: '0.875rem', color: '#f87171', margin: 0 },
  btnRow: { display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' },
};
