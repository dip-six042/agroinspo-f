import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Advert } from '../../lib/api';
import { Button, Modal, Notice, textareaClass, inputClass } from '../ui';

/** Contact a business about a listing or an advert. The enquiry lands in their leads inbox and in Messages. */
export const EnquiryModal: React.FC<{
  businessId: string;
  businessName: string;
  listingId?: string | null;
  adId?: string;
  subject?: string;
  onClose: () => void;
  onNavigate: (v: string) => void;
}> = ({ businessId, businessName, listingId, adId, subject, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ enquiry: { conversationId: string } }>('/enquiries', { businessId, listingId: listingId || undefined, adId, message, sharePhone: phone });
      setSentTo(r.enquiry.conversationId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Contact ${businessName}`} onClose={onClose}>
      {!user ? (
        <>
          <p className="text-[14px]">Create a free account or log in to contact businesses. Your enquiry goes straight to them and appears in your messages.</p>
          <div className="mt-4 flex gap-2"><Button variant="lime" onClick={() => onNavigate('auth:signup')}>Join free</Button><Button variant="outline" onClick={() => onNavigate('auth:login')}>Log in</Button></div>
        </>
      ) : sentTo ? (
        <>
          <Notice tone="success">Sent. {businessName} will reply in your messages.</Notice>
          <Button className="mt-4" onClick={() => onNavigate(`messages:${sentTo}`)}>Open the conversation</Button>
        </>
      ) : (
        <form onSubmit={send} className="space-y-3">
          {subject && <p className="text-[13px] text-slate-600">About: <span className="font-medium text-ink">{subject}</span></p>}
          <label htmlFor="enq-msg" className="text-[13px] font-medium">Your message</label>
          <textarea id="enq-msg" rows={4} className={textareaClass} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Quantity, location, when you need it" required minLength={10} />
          <label htmlFor="enq-phone" className="text-[13px] font-medium">Phone number <span className="font-normal text-slate-500">(optional, shared only with this business)</span></label>
          <input id="enq-phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+234" />
          <p className="text-[11px] text-slate-500">Agree prices and delivery directly with the business. Agro Inspo checks who businesses are, but doesn’t guarantee their products or handle these payments.</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" variant="lime" busy={busy}>Send enquiry</Button>
        </form>
      )}
    </Modal>
  );
};

/** A clearly labelled advert slot. Impressions are recorded only when the card is actually on screen. */
export const SponsoredSlot: React.FC<{ placement: 'feed' | 'events' | 'jobs'; topic?: string; onNavigate: (v: string) => void; className?: string; compact?: boolean }> = ({
  placement, topic = '', onNavigate, className = '', compact
}) => {
  const [ad, setAd] = useState<Advert | null>(null);
  const [enquire, setEnquire] = useState<{ listingId: string | null } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef('');

  useEffect(() => {
    api.get<{ ads: Advert[] }>(`/ads/serve?placement=${placement}&topic=${encodeURIComponent(topic)}`).then((r) => setAd(r.ads[0] ?? null)).catch(() => {});
  }, [placement, topic]);

  useEffect(() => {
    if (!ad || !ref.current || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5) && seen.current !== ad.id) {
        seen.current = ad.id;
        api.post('/ads/impressions', { ids: [ad.id] }).catch(() => {});
      }
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ad?.id]);

  if (!ad) return null;
  const act = async () => {
    const r = await api.post<{ cta: string; url: string; listingId: string | null }>(`/ads/${ad.id}/click`).catch(() => null);
    if (r?.cta === 'website' && r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
    else setEnquire({ listingId: r?.listingId ?? ad.listingId });
  };

  return (
    <div ref={ref} className={`rounded-3xl border border-stone-200 bg-white overflow-hidden ${className}`} aria-label="Advertisement">
      <div className={compact ? '' : 'sm:flex'}>
        {ad.imageUrl && <img src={ad.imageUrl} alt="" className={`object-cover bg-stone-200 ${compact ? 'w-full h-32' : 'w-full h-40 sm:w-48 sm:h-auto shrink-0'}`} loading="lazy" />}
        <div className="p-5 flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Sponsored · {ad.advertiser.name}</p>
          <p className="mt-2 text-[15px] font-medium leading-snug">{ad.headline}</p>
          <p className="mt-1.5 text-[13px] text-slate-600 leading-relaxed">{ad.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-9" onClick={act}>
              {ad.cta === 'website' ? <>Visit website <ArrowUpRight className="w-3.5 h-3.5" /></> : <><MessageCircle className="w-3.5 h-3.5" /> Enquire</>}
            </Button>
            <button className="text-[12px] text-slate-500 underline underline-offset-2" onClick={() => onNavigate(ad.advertiser.role === 'specialist' ? `specialists:${ad.advertiser.id}` : `suppliers:${ad.advertiser.id}`)}>About this advertiser</button>
          </div>
        </div>
      </div>
      {enquire && (
        <EnquiryModal businessId={ad.advertiser.id} businessName={ad.advertiser.name} listingId={enquire.listingId} adId={ad.id} subject={ad.headline}
          onClose={() => setEnquire(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
};
