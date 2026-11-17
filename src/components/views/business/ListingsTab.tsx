import React, { useState } from 'react';
import { ImagePlus, Package, Wrench } from 'lucide-react';
import { api, ApiError, Listing, priceLabel, TOPIC_LABELS, uploadFile } from '../../../lib/api';
import { Button, Field, inputClass, Modal, Notice, Pill, selectClass, textareaClass } from '../../ui';

const EMPTY = { kind: 'product', title: '', description: '', topic: 'crops', priceType: 'fixed', priceNgn: '', unit: '', serviceArea: '', availability: '' };

export const ListingsTab: React.FC<{ listings: Listing[]; verified: boolean; onChanged: () => void }> = ({ listings, verified, onChanged }) => {
  const [editing, setEditing] = useState<Listing | 'new' | null>(null);
  const [f, setF] = useState<typeof EMPTY>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = (l: Listing | 'new') => {
    setEditing(l);
    setError('');
    setF(l === 'new' ? EMPTY : { kind: l.kind, title: l.title, description: l.description, topic: l.topic, priceType: l.priceType, priceNgn: l.priceNgn?.toString() ?? '', unit: l.unit, serviceArea: l.serviceArea, availability: l.availability });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...f, priceNgn: f.priceType === 'quote' ? null : Number(f.priceNgn) };
      if (editing === 'new') await api.post('/me/listings', body);
      else if (editing) await api.patch(`/me/listings/${editing.id}`, body);
      setEditing(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save.');
    } finally {
      setBusy(false);
    }
  };
  const setStatus = (l: Listing, status: string) => api.patch(`/me/listings/${l.id}`, { status }).then(onChanged).catch(() => {});
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-[13px] text-slate-600 max-w-xl">{verified ? 'Published listings appear on your public page and in Suppliers. Enquiries come to Leads.' : 'You can prepare listings now. They appear publicly once your business is verified.'}</p>
        <Button variant="lime" onClick={() => open('new')}>Add a product or service</Button>
      </div>
      {error && !editing && <Notice tone="error" className="mt-4">{error}</Notice>}
      <ul className="mt-6 space-y-3">
        {listings.length === 0 && <li className="text-[13px] text-slate-500">Nothing listed yet.</li>}
        {listings.map((l) => (
          <li key={l.id} className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-wrap gap-4 items-center">
            {l.imageUrl ? <img src={l.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-stone-200" />
              : <div className="w-16 h-16 rounded-xl bg-mist flex items-center justify-center">{l.kind === 'product' ? <Package className="w-6 h-6 text-slate-400" /> : <Wrench className="w-6 h-6 text-slate-400" />}</div>}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{l.title}</p>
              <p className="text-[12px] text-slate-500">{TOPIC_LABELS[l.topic]} · {priceLabel(l)}</p>
            </div>
            <Pill tone={l.status === 'published' ? 'good' : 'neutral'}>{l.status === 'published' ? 'Published' : 'Hidden'}</Pill>
            <div className="flex gap-1.5">
              <label className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-stone-300 hover:border-ink text-[12px] cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5" /> Photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(`/me/listings/${l.id}/image`, file).then(onChanged).catch((er: ApiError) => setError(er.message)); e.target.value = ''; }} />
              </label>
              <Button variant="outline" className="h-9" onClick={() => open(l)}>Edit</Button>
              <Button variant="ghost" className="h-9" onClick={() => setStatus(l, l.status === 'published' ? 'hidden' : 'published')}>{l.status === 'published' ? 'Hide' : 'Publish'}</Button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <Modal title={editing === 'new' ? 'Add a product or service' : 'Edit listing'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="ls-kind" label="Type"><select id="ls-kind" className={`${selectClass} w-full`} value={f.kind} onChange={set('kind')}><option value="product">Product</option><option value="service">Service</option></select></Field>
              <Field id="ls-topic" label="Topic"><select id="ls-topic" className={`${selectClass} w-full`} value={f.topic} onChange={set('topic')}>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              <Field id="ls-title" label="Name"><input id="ls-title" className={inputClass} value={f.title} onChange={set('title')} required /></Field>
            </div>
            <Field id="ls-desc" label="Description" hint="What it is, certification or registration numbers, pack sizes"><textarea id="ls-desc" rows={4} className={textareaClass} value={f.description} onChange={set('description')} required /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="ls-pt" label="Price"><select id="ls-pt" className={`${selectClass} w-full`} value={f.priceType} onChange={set('priceType')}><option value="fixed">Fixed price</option><option value="from">From</option><option value="quote">Price on request</option></select></Field>
              {f.priceType !== 'quote' && <Field id="ls-price" label="Amount (₦)"><input id="ls-price" type="number" min={1} className={inputClass} value={f.priceNgn} onChange={set('priceNgn')} /></Field>}
              {f.priceType !== 'quote' && <Field id="ls-unit" label="Per"><input id="ls-unit" className={inputClass} value={f.unit} onChange={set('unit')} placeholder="per 20 kg bag" /></Field>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="ls-area" label="Where you supply"><input id="ls-area" className={inputClass} value={f.serviceArea} onChange={set('serviceArea')} /></Field>
              <Field id="ls-avail" label="Availability"><input id="ls-avail" className={inputClass} value={f.availability} onChange={set('availability')} placeholder="In stock, from March…" /></Field>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" busy={busy}>Save</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
