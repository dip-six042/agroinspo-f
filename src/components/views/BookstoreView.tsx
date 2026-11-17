import React, { useEffect, useState } from 'react';
import { BookOpen, Download, FileText, Upload, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Book, TOPIC_LABELS, uploadFile } from '../../lib/api';
import { Button, Field, inputClass, Kicker, Modal, naira, Notice, Pill, selectClass, textareaClass, Toast, WRAP } from '../ui';

const Cover: React.FC<{ book: Book; className?: string }> = ({ book, className = '' }) =>
  book.hasCover ? (
    <img src={`/api/books/${book.id}/cover`} alt="" className={`object-cover bg-stone-200 ${className}`} loading="lazy" />
  ) : (
    <div className={`bg-ink text-lime flex items-center justify-center ${className}`}><BookOpen className="w-8 h-8" /></div>
  );

const statusTone = { draft: 'neutral', under_review: 'warn', published: 'good', rejected: 'bad', suspended: 'bad' } as const;
const statusLabel = { draft: 'Draft', under_review: 'In review', published: 'On sale', rejected: 'Needs changes', suspended: 'Taken down' };

/* ---------- detail ---------- */
const BookDetail: React.FC<{ id: string; onClose: () => void; onNavigate: (v: string) => void }> = ({ id, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [b, setB] = useState<Book | null>(null);
  const [refundDays, setRefundDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState<string | null>(null);
  useEffect(() => {
    api.get<{ book: Book; refundDays: number }>(`/books/${id}`).then((r) => (setB(r.book), setRefundDays(r.refundDays))).catch((e: ApiError) => setError(e.message));
  }, [id]);
  const buy = async () => {
    if (!user) return onNavigate('auth:signup');
    setBusy(true);
    try {
      const r = await api.post<{ checkoutUrl: string }>(`/books/${id}/buy`);
      window.location.assign(r.checkoutUrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t start checkout.');
      setBusy(false);
    }
  };
  return (
    <Modal title={b?.title ?? 'Book'} onClose={onClose} wide>
      {error && <Notice tone="error">{error}</Notice>}
      {b && (
        <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-6">
          <Cover book={b} className="w-full aspect-[3/4] rounded-2xl" />
          <div>
            {b.subtitle && <p className="text-[15px] text-slate-600">{b.subtitle}</p>}
            <p className="mt-2 text-[13px]">By <span className="font-medium">{b.author.name}</span>{b.author.title ? ` · ${b.author.title}` : ''}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Pill>{TOPIC_LABELS[b.topic]}</Pill>{b.pages && <Pill>{b.pages} pages</Pill>}<Pill>{b.language}</Pill><Pill>PDF</Pill></div>
            <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-wrap">{b.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {b.owned ? (
                <a href={`/api/books/${b.id}/download`} className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-lime hover:bg-lime-deep text-[13px] font-medium"><Download className="w-4 h-4" /> Download</a>
              ) : user?.id === b.author.id ? (
                <Pill tone="good" className="h-11 px-5 text-[13px]">You’re the author</Pill>
              ) : (
                <Button variant="lime" busy={busy} onClick={buy}>Buy for {naira(b.priceNgn)}</Button>
              )}
              {b.hasSample && <a href={`/api/books/${b.id}/sample`} className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-stone-300 hover:border-ink text-[13px]"><FileText className="w-4 h-4" /> Read a sample</a>}
            </div>
            {!b.owned && <p className="mt-3 text-[11px] text-slate-500">Paid securely through Kora. The book is added to your library straight away. You can ask for a refund within {refundDays} days of buying.</p>}
            {b.owned && b.purchase && Date.now() - new Date(b.purchase.paidAt).getTime() < refundDays * 86400000 && (
              refunding === null ? (
                <button className="mt-4 text-[12px] underline text-slate-600" onClick={() => setRefunding('')}>Ask for a refund</button>
              ) : refunding === 'sent' ? (
                <Notice tone="success" className="mt-4">Refund request sent. Support will reply in Help &amp; support.</Notice>
              ) : (
                <div className="mt-4">
                  <label htmlFor="bk-refund" className="text-[12px] text-slate-600">Why are you asking for a refund? (at least 20 characters)</label>
                  <textarea id="bk-refund" rows={3} className={`${textareaClass} mt-1`} value={refunding} onChange={(e) => setRefunding(e.target.value)} />
                  <Button className="mt-2 h-9" variant="outline" disabled={refunding.trim().length < 20} onClick={async () => {
                    try {
                      await api.post('/support', { category: 'refund', subjectType: 'book_purchase', subjectId: b.purchase!.id, title: `Refund: ${b.title}`, message: refunding });
                      setRefunding('sent');
                    } catch (e) {
                      setError(e instanceof ApiError ? e.message : 'Couldn’t send.');
                    }
                  }}>Send request</Button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ---------- author tools ---------- */
const AuthorBooks: React.FC = () => {
  const [data, setData] = useState<{ books: Book[]; canPublish: boolean } | null>(null);
  const [editing, setEditing] = useState<Book | 'new' | null>(null);
  const [f, setF] = useState({ title: '', subtitle: '', description: '', topic: 'crops', language: 'English', pages: '', priceNgn: '3000' });
  const [rights, setRights] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const load = () => api.get<{ books: Book[]; canPublish: boolean }>('/me/books').then(setData).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  if (!data) return error ? <Notice tone="error">{error}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>;
  if (!data.canPublish) return <Notice>Specialists and screened creators can publish books. Apply for creator screening from Creator in your account menu.</Notice>;

  const open = (b: Book | 'new') => {
    setEditing(b);
    setError('');
    setRights(false);
    if (b !== 'new') setF({ title: b.title, subtitle: b.subtitle, description: b.description, topic: b.topic, language: b.language, pages: b.pages?.toString() ?? '', priceNgn: String(b.priceNgn) });
    else setF({ title: '', subtitle: '', description: '', topic: 'crops', language: 'English', pages: '', priceNgn: '3000' });
  };
  const save = async () => {
    setError('');
    const body = { ...f, pages: f.pages ? Number(f.pages) : null, priceNgn: Number(f.priceNgn) };
    try {
      const r = editing === 'new' ? await api.post<{ book: Book }>('/books', body) : await api.patch<{ book: Book }>(`/books/${(editing as Book).id}`, body);
      setEditing(r.book);
      load();
      setToastMsg('Details saved. Now upload the files.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t save.');
    }
  };
  const upload = async (kind: 'cover' | 'sample' | 'book', file?: File) => {
    if (!file || editing === 'new' || !editing) return;
    setError('');
    try {
      await uploadFile(`/books/${editing.id}/files/${kind}`, file);
      const r = await api.get<{ book: Book }>(`/books/${editing.id}`);
      setEditing(r.book);
      setToastMsg(`${kind === 'book' ? 'Book file' : kind === 'cover' ? 'Cover' : 'Sample'} uploaded.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed.');
    }
  };
  const submit = async () => {
    if (editing === 'new' || !editing) return;
    try {
      await api.post(`/books/${editing.id}/submit`, { rightsDeclaration: rights });
      setEditing(null);
      load();
      setToastMsg('Submitted for review. We’ll let you know when it’s on sale.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t submit.');
    }
  };
  const ed = editing && editing !== 'new' ? editing : null;
  const editable = editing === 'new' || (ed && ['draft', 'rejected'].includes(ed.status));

  return (
    <div>
      <div className="flex justify-between items-center gap-3">
        <p className="text-[13px] text-slate-500">You earn the price less the platform commission, available a week after each sale.</p>
        <Button variant="lime" onClick={() => open('new')}>Publish a book</Button>
      </div>
      <ul className="mt-6 space-y-3">
        {data.books.map((b) => (
          <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-4 flex gap-4 items-center">
            <Cover book={b} className="w-14 h-[74px] rounded-lg shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{b.title}</p>
              <p className="text-[12px] text-slate-500">{naira(b.priceNgn)} · you get {naira(b.netPerSaleNgn ?? 0)} per sale · {b.sales ?? 0} sold</p>
              {b.reviewNote && b.status !== 'published' && <p className="text-[12px] text-rose-700 mt-1">{b.reviewNote}</p>}
            </div>
            <Pill tone={statusTone[b.status]}>{statusLabel[b.status]}</Pill>
            <Button variant="outline" className="h-9" onClick={() => open(b)}>{['draft', 'rejected'].includes(b.status) ? 'Edit' : 'View'}</Button>
          </li>
        ))}
        {data.books.length === 0 && <p className="text-[13px] text-slate-500">No books yet.</p>}
      </ul>

      {editing && (
        <Modal title={editing === 'new' ? 'Publish a book' : editing.title} onClose={() => setEditing(null)} wide>
          <fieldset disabled={!editable} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="bk-title" label="Title"><input id="bk-title" className={inputClass} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
              <Field id="bk-sub" label="Subtitle"><input id="bk-sub" className={inputClass} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></Field>
            </div>
            <Field id="bk-desc" label="Description" hint="At least 50 characters: who it’s for and what they’ll learn."><textarea id="bk-desc" rows={4} className={textareaClass} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field id="bk-topic" label="Topic"><select id="bk-topic" className={`${selectClass} w-full`} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              <Field id="bk-lang" label="Language"><input id="bk-lang" className={inputClass} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} /></Field>
              <Field id="bk-pages" label="Pages"><input id="bk-pages" type="number" className={inputClass} value={f.pages} onChange={(e) => setF({ ...f, pages: e.target.value })} /></Field>
              <Field id="bk-price" label="Price (₦)"><input id="bk-price" type="number" min={500} className={inputClass} value={f.priceNgn} onChange={(e) => setF({ ...f, priceNgn: e.target.value })} /></Field>
            </div>
            {editable && <Button variant="outline" onClick={save}>{editing === 'new' ? 'Save details' : 'Save changes'}</Button>}
          </fieldset>

          {ed && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([['cover', 'Cover image', 'JPG, PNG or WebP, up to 2 MB', ed.hasCover, 'image/jpeg,image/png,image/webp'],
                ['book', 'Book file', 'PDF or EPUB, up to 50 MB', !!ed.hasBookFile, '.pdf,.epub'],
                ['sample', 'Free sample', 'Optional. PDF or EPUB, up to 10 MB', ed.hasSample, '.pdf,.epub']] as const).map(([kind, label, hint, done, accept]) => (
                <label key={kind} className={`rounded-2xl border p-4 ${editable ? 'cursor-pointer hover:border-ink' : ''} ${done ? 'border-ink' : 'border-dashed border-stone-300'}`}>
                  <span className="flex items-center gap-2 text-[13px] font-medium">{done ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}{label}</span>
                  <span className="block mt-1 text-[11px] text-slate-500">{done ? 'Uploaded. Choose again to replace.' : hint}</span>
                  {editable && <input type="file" accept={accept} className="sr-only" onChange={(e) => upload(kind, e.target.files?.[0])} />}
                </label>
              ))}
            </div>
          )}
          {ed && editable && (
            <div className="mt-6">
              <label className="flex items-start gap-3 text-[13px]">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={rights} onChange={(e) => setRights(e.target.checked)} />
                <span>I own this content or have the right to sell it, and it doesn’t copy anyone else’s work. I understand it can be removed after a copyright complaint.</span>
              </label>
              <Button className="mt-4" variant="lime" disabled={!rights} onClick={submit}>Submit for review</Button>
            </div>
          )}
          {error && <Notice tone="error" className="mt-4">{error}</Notice>}
        </Modal>
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};

/* ---------- page ---------- */
export const BookstoreView: React.FC<{ sub?: string; onNavigate: (v: string) => void }> = ({ sub, onNavigate }) => {
  const { user } = useAuth();
  const tab = sub === 'library' || sub === 'mine' ? sub : 'store';
  const openId = sub && !['library', 'mine', 'store'].includes(sub) ? sub : undefined;
  const [books, setBooks] = useState<Book[] | null>(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab === 'mine') return;
    setBooks(null);
    const url = tab === 'library' ? '/me/library' : `/books${topic ? `?topic=${topic}` : ''}`;
    api.get<{ books: Book[] }>(url).then((r) => setBooks(r.books)).catch((e: ApiError) => setError(e.message));
  }, [tab, topic, user?.id]);

  const tabs = [
    { id: 'store', label: 'Store', view: 'books' },
    ...(user ? [{ id: 'library', label: 'My library', view: 'books:library' }, { id: 'mine', label: 'My books', view: 'books:mine' }] : [])
  ];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <Kicker>Bookstore</Kicker>
      <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em] max-w-3xl">Practical handbooks from people who farm and advise.</h1>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200">
        <div className="flex gap-6 text-[13px] font-medium" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => onNavigate(t.view)} className={`pb-3 ${tab === t.id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>{t.label}</button>
          ))}
        </div>
        {tab === 'store' && (
          <select aria-label="Topic" className={`${selectClass} mb-3 h-9 text-[13px]`} value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics</option>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        )}
      </div>
      {error && <Notice tone="error" className="mt-6">{error}</Notice>}
      <div className="mt-8">
        {tab === 'mine' ? <AuthorBooks /> : (
          <>
            {books?.length === 0 && <Notice>{tab === 'library' ? 'Books you buy appear here, ready to download.' : 'No books on this topic yet.'}</Notice>}
            <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
              {books?.map((b) => (
                <li key={b.id}>
                  <button onClick={() => onNavigate(`books:${b.id}`)} className="w-full text-left group">
                    <Cover book={b} className="w-full aspect-[3/4] rounded-2xl group-hover:opacity-90 transition-opacity" />
                    <p className="mt-3 text-[14px] font-medium leading-snug">{b.title}</p>
                    <p className="text-[12px] text-slate-500">{b.author.name}</p>
                    <p className="mt-1 text-[13px] font-mono-numbers">{b.owned ? 'In your library' : naira(b.priceNgn)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {openId && <BookDetail id={openId} onClose={() => onNavigate(tab === 'store' ? 'books' : `books:${tab}`)} onNavigate={onNavigate} />}
    </div>
  );
};
