// Kept in step with backend/src/places.js. A city or state suggests a country.
// Browsing is never limited to that country.

export const COUNTRIES = `
Afghanistan
Albania
Algeria
Angola
Argentina
Armenia
Australia
Austria
Azerbaijan
Bangladesh
Belarus
Belgium
Belize
Benin
Bhutan
Bolivia
Bosnia and Herzegovina
Botswana
Brazil
Bulgaria
Burkina Faso
Burundi
Cambodia
Cameroon
Canada
Central African Republic
Chad
Chile
China
Colombia
Costa Rica
Cote d'Ivoire
Croatia
Cuba
Cyprus
Czechia
Denmark
Dominican Republic
DR Congo
Ecuador
Egypt
El Salvador
Eritrea
Estonia
Eswatini
Ethiopia
Finland
France
Gabon
Gambia
Georgia
Germany
Ghana
Greece
Guatemala
Guinea
Guinea-Bissau
Guyana
Haiti
Honduras
Hungary
India
Indonesia
Iran
Iraq
Ireland
Israel
Italy
Jamaica
Japan
Jordan
Kazakhstan
Kenya
Kuwait
Laos
Latvia
Lebanon
Lesotho
Liberia
Libya
Lithuania
Luxembourg
Madagascar
Malawi
Malaysia
Mali
Malta
Mauritania
Mauritius
Mexico
Moldova
Mongolia
Montenegro
Morocco
Mozambique
Myanmar
Namibia
Nepal
Netherlands
New Zealand
Nicaragua
Niger
Nigeria
North Macedonia
Norway
Oman
Pakistan
Panama
Papua New Guinea
Paraguay
Peru
Philippines
Poland
Portugal
Qatar
Romania
Russia
Rwanda
Saudi Arabia
Senegal
Serbia
Sierra Leone
Singapore
Slovakia
Slovenia
Somalia
South Africa
South Korea
South Sudan
Spain
Sri Lanka
Sudan
Sweden
Switzerland
Syria
Taiwan
Tajikistan
Tanzania
Thailand
Togo
Tunisia
Turkey
Uganda
Ukraine
United Arab Emirates
United Kingdom
United States
Uruguay
Uzbekistan
Venezuela
Vietnam
Yemen
Zambia
Zimbabwe
`.trim().split('\n');

// Cities, states and regions that point to a country. A name may belong to more than one
// country (Punjab, Victoria, Córdoba): then we ask the member instead of guessing (PRD §4.1).
const PLACES: [string, string[]][] = [
  ['Nigeria', ['abia','adamawa','akwa ibom','anambra','bauchi','bayelsa','benue','borno','cross river','delta state','ebonyi','edo','ekiti','enugu','gombe','imo','jigawa','kaduna','kano','katsina','kebbi','kogi','kwara','lagos','nasarawa','niger state','ogun','ondo','osun','oyo','plateau state','rivers state','sokoto','taraba','yobe','zamfara','fct','abuja','ibadan','port harcourt','benin city','victoria island','ikeja','lekki','iseyin','abeokuta','ilorin','owerri','calabar','uyo','jos','warri']],
  ['Ghana', ['greater accra','ashanti','volta region','upper east','upper west','brong ahafo','bono','ahafo','accra','kumasi','tamale','takoradi']],
  ['Kenya', ['nairobi','mombasa','kisumu','nakuru','eldoret','kiambu','uasin gishu','kakamega','machakos','kilifi','kwale','meru','nyeri','kisii']],
  ['South Africa', ['gauteng','western cape','eastern cape','kwazulu-natal','limpopo','mpumalanga','free state','johannesburg','cape town','durban','pretoria']],
  ['United States', ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming','district of columbia','usa','u.s.a','georgia, usa','georgia, united states','birmingham','santa fe','victoria']],
  ['United Kingdom', ['england','scotland','wales','northern ireland','london','manchester','birmingham','glasgow','cardiff','belfast','edinburgh','uk','britain','perth']],
  ['Canada', ['ontario','quebec','british columbia','alberta','manitoba','saskatchewan','nova scotia','new brunswick','toronto','vancouver','montreal','calgary','victoria']],
  ['India', ['punjab','haryana','uttar pradesh','bihar','maharashtra','karnataka','tamil nadu','kerala','gujarat','rajasthan','west bengal','andhra pradesh','telangana','madhya pradesh','odisha','assam','delhi','mumbai','hyderabad']],
  ['Pakistan', ['punjab','sindh','khyber pakhtunkhwa','balochistan','lahore','karachi','islamabad','hyderabad']],
  ['Australia', ['new south wales','victoria','queensland','western australia','south australia','tasmania','sydney','melbourne','brisbane','perth']],
  ['Brazil', ['sao paulo','são paulo','minas gerais','parana','paraná','rio grande do sul','bahia','goias','goiás','mato grosso']],
  ['China', ['beijing','shanghai','guangdong','sichuan','henan','shandong','hubei','jiangsu']],
  ['Ethiopia', ['addis ababa','oromia','amhara','tigray']],
  ['Tanzania', ['dar es salaam','arusha','dodoma','mwanza']],
  ['Uganda', ['kampala','wakiso','jinja']],
  ['Egypt', ['cairo','alexandria','giza']],
  ['Morocco', ['casablanca','rabat','marrakesh','fes']],
  ['France', ['paris','ile-de-france','île-de-france','nouvelle-aquitaine','occitanie']],
  ['Germany', ['bavaria','bayern','lower saxony','north rhine-westphalia','berlin','munich']],
  ['Netherlands', ['amsterdam','rotterdam']],
  ['Spain', ['andalusia','andalucía','castile','catalonia','madrid','barcelona','cordoba','córdoba']],
  ['Mexico', ['jalisco','sinaloa','sonora','mexico city','ciudad de mexico']],
  ['Argentina', ['buenos aires','cordoba','córdoba','santa fe']],
  ['Indonesia', ['jakarta','java','sumatra','bali']],
  ['Philippines', ['manila','luzon','mindanao','cebu']],
  ['Bangladesh', ['dhaka','chittagong','rajshahi']]
];

const NAMES = new Map<string, Set<string>>();
const add = (name: string, country: string) => {
  const key = name.toLowerCase();
  if (!NAMES.has(key)) NAMES.set(key, new Set());
  NAMES.get(key)!.add(country);
};
for (const country of COUNTRIES) add(country, country);
for (const [country, names] of PLACES) for (const n of names) add(n, country);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = [...NAMES.keys()].map((name) => ({ name, re: new RegExp(`(^|[^\\p{L}])${escapeRe(name)}(?=$|[^\\p{L}])`, 'iu') }));

/** Country for a typed city/state. `country` is '' when nothing matched or the place is ambiguous; `options` then lists the candidates. */
export function matchPlace(text: string): { country: string; options: string[] } {
  const value = String(text || '').trim();
  if (!value) return { country: '', options: [] };
  let hits = PATTERNS.filter((p) => p.re.test(value)).map((p) => p.name);
  // "Niger State" also contains "Niger"; "Victoria Island" contains "Victoria". Keep the longer name.
  hits = hits.filter((h) => !hits.some((o) => o !== h && o.length > h.length && o.includes(h)));
  if (!hits.length) return { country: '', options: [] };
  const sets = hits.map((h) => NAMES.get(h)!);
  const common = [...sets[0]].filter((c) => sets.every((s) => s.has(c)));
  if (common.length === 1) return { country: common[0], options: common };
  // Conflicting hints ("Lagos, Portugal"): a country typed by name wins when it is the only one.
  const named = hits.filter((h) => COUNTRIES.some((c) => c.toLowerCase() === h));
  if (named.length === 1) {
    const c = COUNTRIES.find((x) => x.toLowerCase() === named[0])!;
    return { country: c, options: [c] };
  }
  const options = [...new Set(sets.flatMap((s) => [...s]))].sort();
  return { country: '', options };
}

export function countryFromPlace(text: string): string {
  return matchPlace(text).country;
}

export function placeLabel(location: string, country?: string) {
  if (!country || location.toLowerCase().includes(country.toLowerCase())) return location;
  return location ? `${location}, ${country}` : country;
}
