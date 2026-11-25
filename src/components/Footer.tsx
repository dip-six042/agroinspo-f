import React from 'react';
import { BrandMark } from './Navbar';

interface FooterProps {
  onNavigate: (view: string) => void;
}

const COLUMNS: { title: string; links: { label: string; view?: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Experts', view: 'specialists' },
      { label: 'Live Events', view: 'events' },
      { label: 'Jobs', view: 'jobs' },
      { label: 'Farm Opportunities', view: 'opportunities' },
      { label: 'Suppliers', view: 'suppliers' },
      { label: 'Bookstore', view: 'books' }
    ]
  },
  {
    title: 'Company',
    links: [{ label: 'About' }, { label: 'Partnerships' }, { label: 'Contact' }, { label: 'Help & FAQ' }]
  },
  {
    title: 'Policies',
    links: [
      { label: 'Terms of Use' },
      { label: 'Privacy Policy' },
      { label: 'Community Guidelines' },
      { label: 'Creator Policy' },
      { label: 'Advertising Policy' },
      { label: 'Refund & Cancellation' },
      { label: 'Risk Disclosures' }
    ]
  }
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer className="bg-ink text-white mt-24">
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 pb-10">
      <p className="font-display font-normal text-[22px] sm:text-[26px] leading-[1.3] tracking-[-0.015em] max-w-xl">
        Growing agriculture worldwide with trusted expertise, fair work and transparent partnerships.
      </p>

      <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5">
            <BrandMark className="w-6 h-6 text-lime" />
            <span className="font-display text-[17px] font-medium">Agro Inspo</span>
          </button>
          <p className="mt-4 text-[12px] leading-relaxed text-white/50 max-w-[240px]">
            support@agroinspo.com
            <br />
            <span className="font-mono-numbers">+234 800 2476 4677</span>
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <span className="block text-[11px] text-white/50 mb-4">{col.title}</span>
            <ul className="space-y-2.5 text-[13px] text-white/80">
              {col.links.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => l.view && onNavigate(l.view)}
                    className="hover:text-lime transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-[11px] leading-relaxed text-white/40">
        <span>© 2026 Agro Inspo. All rights reserved.</span>
        <span className="max-w-2xl md:text-right">
          Farm opportunities are reviewed listings, not investment advice. Investment features are enabled only after legal and
          compliance approval. Past performance does not guarantee future results.
        </span>
      </div>
    </div>
  </footer>
);
