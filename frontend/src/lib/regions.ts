export interface Region {
  id: string;
  label: string;
  description: string;
  // ISO 3166-1 country codes used for TMDB with_origin_country.
  countries: string[];
  // ISO 639-1 language codes used for a soft scoring bonus.
  languages: string[];
}

export const REGIONS: Region[] = [
  { id: 'hollywood', label: 'Hollywood', description: 'US studio and indie', countries: ['US'], languages: ['en'] },
  { id: 'bollywood', label: 'Bollywood', description: 'Hindi-language India', countries: ['IN'], languages: ['hi'] },
  { id: 'nollywood', label: 'Nollywood', description: 'Nigerian cinema', countries: ['NG'], languages: ['en', 'yo', 'ig'] },
  {
    id: 'african',
    label: 'African Cinema',
    description: 'Across the continent',
    countries: ['NG', 'ZA', 'EG', 'KE', 'GH', 'SN', 'MA', 'TN', 'ET', 'DZ'],
    languages: ['sw', 'ar', 'yo', 'ha', 'zu', 'am'],
  },
  { id: 'korean', label: 'Korean', description: 'K-cinema and K-drama', countries: ['KR'], languages: ['ko'] },
  { id: 'japanese', label: 'Japanese', description: 'Live action and anime', countries: ['JP'], languages: ['ja'] },
  {
    id: 'asian',
    label: 'Asian Cinema',
    description: 'East and Southeast Asia',
    countries: ['JP', 'KR', 'CN', 'HK', 'TW', 'TH', 'VN', 'ID', 'PH', 'IN'],
    languages: ['ja', 'ko', 'zh', 'cn', 'th', 'vi', 'id', 'hi'],
  },
  {
    id: 'european',
    label: 'European',
    description: 'Continental and UK',
    countries: ['GB', 'FR', 'IT', 'DE', 'ES', 'SE', 'DK', 'PL', 'NL', 'NO'],
    languages: ['fr', 'it', 'de', 'es', 'sv', 'da', 'pl', 'nl', 'no'],
  },
  {
    id: 'latin',
    label: 'Latin American',
    description: 'Mexico, Brazil, and more',
    countries: ['MX', 'BR', 'AR', 'CL', 'CO', 'PE'],
    languages: ['es', 'pt'],
  },
];

export function getRegion(id: string | null): Region | undefined {
  if (!id) {
    return undefined;
  }
  return REGIONS.find((region) => region.id === id);
}
