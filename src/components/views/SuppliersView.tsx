import React, { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Globe, MapPin, MessageCircle, Package, Search, Wrench } from 'lucide-react';
import { api, ApiError, BusinessProfile, Listing, priceLabel, TOPIC_LABELS, formatEventDate } from '../../lib/api';
import { Avatar, Button, Kicker, Notice, Pill, selectClass, WRAP } from '../ui';
import { EnquiryModal } from '../business/Sponsored';

export const VerificationBadge: React.FC<{ b: Pick<BusinessProfile, 'verification'>; long?: boolean }> = ({ b, long }) =>
  b.verification.status === 'verified' ? (
    <span className="inline-flex items-center gap-1 text-[12px] text-emerald-800">
      <BadgeCheck className="w-4 h-4" /> Verified business{long && b.verification.verifiedAt ? ` · ${new Date(b.verification.verifiedAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}` : ''}
    </span>
  ) : <Pill tone="warn">Not verified yet</Pill>;

const ListingCard: React.FC<{ l: Listing; onOpen?: () => void; onEnquire: () => void }> = ({ l, onOpen, onEnquire }) => (
  <li className="rounded-3xl border border-stone-200 bg-white overflow-hidden flex flex-col">
    {l.imageUrl ? <img src={l.imageUrl} alt="" className="w-full h-40 object-cover bg-stone-200" loading="lazy" />
      : <div className="w-full h-40 bg-mist flex items-center justify-center">{l.kind === 'product' ? <Package className="w-8 h-8 text-slate-400" /> : <Wrench className="w-8 h-8 text-slate-400" />}</div>}
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex flex-wrap gap-1.5"><Pill>{l.kind === 'product' ? 'Product' : 'Service'}</Pill><Pill>{TOPIC_LABELS[l.topic] ?? l.topic}</Pill></div>
      <p className="mt-3 text-[15px] font-medium leading-snug">{l.title}</p>
      {l.business && <button onClick={onOpen} className="mt-1 text-left text-[12px] text-slate-600 hover:text-ink inline-flex items-center gap-1">{l.business.name}{l.business.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" aria-label="Verified business" />}</button>}
      <p className="mt-2 text-[13px] text-slate-600 line-clamp-3 leading-relaxed">{l.description}</p>
      {l.serviceArea && <p className="mt-2 text-[12px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.serviceArea}</p>}
      <div className="mt-auto pt-4 flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium font-mono-numbers">{priceLabel(l)}</span>
        <Button variant="outline" className="h-9" onClick={onEnquire}><MessageCircle className="w-3.5 h-3.5" /> Enquire</Button>
      </div>
    </div>
  </li>
);

/* ---------- public business page ---------- */
const BusinessPage: React.FC<{ id: string; onNavigate: (v: string) => void }> = ({ id, onNavigate }) => {
  const [d, setD] = useState<{ business: BusinessProfile; categories: Record<string, string>; listings: Listing[]; sponsoring: { id: string; title: string; startsAt: string }[] } | null>(null);
  const [error, setError] = useState('');
  const [enquire, setEnquire] = useState<Listing | 'general' | null>(null);
  useEffect(() => {
    api.get<any>(`/businesses/${id}`).then(setD).catch((e: ApiError) => setError(e.message));
  }, [id]);
  if (error) return <div className={`${WRAP} py-16`}><Notice tone="error">{error}</Notice></div>;
  if (!d) return <div className={`${WRAP} py-16 text-[13px] text-slate-500`}>Loading…</div>;
  const b = d.business;
  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <button onClick={() => onNavigate('suppliers')} className="inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-ink"><ArrowLeft className="w-4 h-4" /> All suppliers</button>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10">
        <div>
          <div className="flex items-start gap-5">
            <Avatar name={b.name} src={b.avatarUrl} size={72} />
            <div>
              <h1 className="font-display text-[34px] sm:text-[44px] font-normal leading-[1.05] tracking-[-0.03em]">{b.name}</h1>
              {b.legalName && b.legalName !== b.name && <p className="mt-1 text-[13px] text-slate-500">{b.legalName}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3"><VerificationBadge b={b} long /><Pill>{d.categories[b.category] ?? b.category}</Pill></div>
            </div>
          </div>
          {b.about && <p className="mt-6 text-[15px] leading-relaxed max-w-2xl whitespace-pre-wrap">{b.about}</p>}
          <h2 className="mt-10 text-[15px] font-medium">Products &amp; services</h2>
          {d.listings.length === 0 ? <p className="mt-3 text-[13px] text-slate-500">Nothing listed yet.</p> : (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {d.listings.map((l) => <ListingCard key={l.id} l={l} onEnquire={() => setEnquire(l)} />)}
            </ul>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 text-[13px] space-y-3">
            {b.region && <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0" /> <span>{b.region}{b.serviceArea ? ` · serves ${b.serviceArea}` : ''}</span></p>}
            {b.website && <a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className="flex gap-2 underline underline-offset-2"><Globe className="w-4 h-4 shrink-0" /> {b.website.replace(/^https:\/\//, '')}</a>}
            <Button variant="lime" className="w-full" onClick={() => setEnquire('general')}><MessageCircle className="w-4 h-4" /> Contact this business</Button>
          </div>
          <div className="rounded-3xl bg-mist p-6 text-[13px] leading-relaxed">
            <p className="font-medium">What “verified” means here</p>
            <p className="mt-2 text-slate-700">{b.verification.status === 'verified' ? `We checked: ${b.verification.scope}` : 'This business hasn’t been verified yet.'}</p>
            <p className="mt-2 text-[11px] text-slate-500">Verification confirms who the business is. It isn’t a guarantee of product quality, prices or delivery. Agree terms directly, and report anything that looks wrong.</p>
          </div>
          {d.sponsoring.length > 0 && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <p className="text-[13px] font-medium">Sponsoring</p>
              <ul className="mt-2 space-y-2 text-[13px]">
                {d.sponsoring.map((e) => <li key={e.id}><button className="text-left underline underline-offset-2" onClick={() => onNavigate(`events:${e.id}`)}>{e.title}</button><span className="block text-[11px] text-slate-500">{formatEventDate(e.startsAt)}</span></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
      {enquire && (
        <EnquiryModal businessId={b.id} businessName={b.name} listingId={enquire === 'general' ? null : enquire.id} subject={enquire === 'general' ? undefined : enquire.title}
          onClose={() => setEnquire(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
};

/* ---------- marketplace + directory ---------- */
export const SuppliersView: React.FC<{ id?: string; onNavigate: (v: string) => void }> = ({ id, onNavigate }) => {
  const [tab, setTab] = useState<'products' | 'businesses'>('products');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState('');
  const [category, setCategory] = useState('');
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [businesses, setBusinesses] = useState<BusinessProfile[] | null>(null);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [enquire, setEnquire] = useState<Listing | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (id) return;
    const p = new URLSearchParams({ q: debounced });
    if (tab === 'products') {
      if (topic) p.set('topic', topic);
      if (kind) p.set('kind', kind);
      api.get<{ listings: Listing[] }>(`/listings?${p}`).then((r) => setListings(r.listings)).catch(() => setListings([]));
    } else {
      if (category) p.set('category', category);
      api.get<{ businesses: BusinessProfile[]; categories: Record<string, string> }>(`/businesses?${p}`).then((r) => (setBusinesses(r.businesses), setCategories(r.categories))).catch(() => setBusinesses([]));
    }
  }, [id, tab, debounced, topic, kind, category]);

  if (id) return <BusinessPage id={id} onNavigate={onNavigate} />;

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <Kicker>Suppliers</Kicker>
      <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em] max-w-3xl">Inputs, equipment and services from verified agricultural businesses.</h1>
      <div className="mt-8 flex border-b border-stone-200 gap-6 text-[13px] font-medium" role="tablist">
        {([['products', 'Products & services'], ['businesses', 'Businesses']] as const).map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`pb-3 ${tab === t ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <label htmlFor="sup-q" className="sr-only">Search</label>
          <input id="sup-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'products' ? 'Seed, feed, tractor hire, state…' : 'Business name, service or area'}
            className="w-full h-11 pl-10 pr-4 rounded-full border border-stone-300 bg-white text-[14px] focus:outline-none focus:border-ink" />
        </div>
        {tab === 'products' ? (
          <>
            <select aria-label="Topic" className={selectClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All topics</option>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select aria-label="Type" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Products and services</option><option value="product">Products</option><option value="service">Services</option>
            </select>
          </>
        ) : (
          <select aria-label="Category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>{Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        )}
      </div>
      <p className="mt-3 text-[12px] text-slate-500">Only businesses whose identity we’ve checked appear here. Verification isn’t a guarantee of quality; agree prices and delivery directly with the supplier.</p>

      {tab === 'products' ? (
        <>
          {listings?.length === 0 && <Notice className="mt-8">Nothing matches yet. Try a broader search.</Notice>}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings?.map((l) => <ListingCard key={l.id} l={l} onOpen={() => onNavigate(`suppliers:${l.businessId}`)} onEnquire={() => setEnquire(l)} />)}
          </ul>
        </>
      ) : (
        <>
          {businesses?.length === 0 && <Notice className="mt-8">No verified businesses match yet.</Notice>}
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {businesses?.map((b) => (
              <li key={b.id}>
                <button onClick={() => onNavigate(`suppliers:${b.id}`)} className="w-full h-full text-left rounded-3xl border border-stone-200 bg-white hover:border-stone-400 p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={b.name} src={b.avatarUrl} size={48} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{b.name}</p>
                      <p className="text-[12px] text-slate-500">{categories[b.category] ?? b.category}</p>
                      <div className="mt-2"><VerificationBadge b={b} /></div>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] text-slate-600 line-clamp-2">{b.about}</p>
                  <p className="mt-3 text-[12px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.region}{b.listingCount ? ` · ${b.listingCount} listed` : ''}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {enquire && enquire.business && (
        <EnquiryModal businessId={enquire.businessId} businessName={enquire.business.name} listingId={enquire.id} subject={enquire.title} onClose={() => setEnquire(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
};
