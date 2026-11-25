import React, { useState } from 'react';
import { COUNTRIES, matchPlace } from '../data/places';
import { Field, inputClass, selectClass } from './ui';

export function usePlace(initialLocation = '', initialCountry = '') {
  const [location, setLocation] = useState(initialLocation);
  const [country, setCountry] = useState(initialCountry);
  const [picked, setPicked] = useState(Boolean(initialCountry));
  // Countries a typed place could belong to, when it matches more than one (e.g. Punjab).
  const [options, setOptions] = useState<string[]>([]);

  const resolve = (value: string) => {
    const m = matchPlace(value);
    setOptions(m.country ? [] : m.options);
    if (m.country) setCountry(m.country);
    else if (m.options.length > 1) setCountry('');
  };
  const onLocation = (value: string) => {
    setLocation(value);
    if (!picked) resolve(value);
  };
  const onCountry = (value: string) => {
    setPicked(value !== '');
    setCountry(value);
    if (value) setOptions([]);
    else resolve(location);
  };

  return { location, country, options, onLocation, onCountry };
}

export const PlaceFields: React.FC<{
  idPrefix: string;
  location: string;
  country: string;
  onLocation: (value: string) => void;
  onCountry: (value: string) => void;
  options?: string[];
}> = ({ idPrefix, location, country, onLocation, onCountry, options = [] }) => (
  <>
    <Field id={`${idPrefix}-loc`} label="City or state" hint="Type a city or state and we’ll match the country. You can change it.">
      <input id={`${idPrefix}-loc`} className={inputClass} value={location} onChange={(e) => onLocation(e.target.value)} maxLength={120} placeholder="e.g. Oyo, Nairobi, Punjab" />
    </Field>
    <Field id={`${idPrefix}-country`} label="Country" hint="Your country is how we place your profile. Specialists, jobs and events from every country stay open to you.">
      <select id={`${idPrefix}-country`} className={selectClass} value={country} onChange={(e) => onCountry(e.target.value)}>
        <option value="">Select a country</option>
        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {!country && options.length > 1 && (
        <p role="status" className="mt-2 text-[12px] text-amber-700">
          “{location}” is in more than one country ({options.join(', ')}). Pick yours above.
        </p>
      )}
    </Field>
  </>
);
