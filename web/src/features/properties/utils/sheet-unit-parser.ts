/**
 * Global Standard Asset & Unit Mapping Engine for Everloft Google Sheet Sync
 * Standardizes property codes, unit numbers, and partner profit-sharing rules.
 */

export type PartnerSplitModel = 'standard_3way' | 'navasthya_50_50' | 'syed_platinum_10_fee';

export type PropertyAssetConfig = {
  propertyCode: string;
  propertyName: string;
  tabNames: string[];
  units: string[];
  partnerSplitModel: PartnerSplitModel;
  everloftPartners: string[];
  navasthyaShare?: number;
  everloftFeeRate?: number;
};

export type ProfitDistributionResult = {
  grossAmount: number;
  netPayout: number;
  navasthyaShareAmount: number;
  ownerShareAmount: number;
  everloftCompanyAmount: number;
  partnerDistribution: Record<string, number>;
};

export const PROPERTY_ASSET_CATALOG: PropertyAssetConfig[] = [
  {
    propertyCode: 'pinnacle',
    propertyName: 'Isha the Pinnacle',
    tabNames: ['pinnacle income', 'pinnacle expenses'],
    units: ['VILLA', 'PINNACLE', 'MAIN'],
    partnerSplitModel: 'standard_3way',
    everloftPartners: ['akhil', 'nikhil', 'jithin'],
  },
  {
    propertyCode: 'greenvista',
    propertyName: 'Greenvista Villa',
    tabNames: ['greenvista income', 'greenvista expenses', 'greenvista expenses vineeth'],
    units: ['VILLA', 'GREENVISTA', 'MAIN'],
    partnerSplitModel: 'standard_3way',
    everloftPartners: ['akhil', 'nikhil', 'jithin'],
  },
  {
    propertyCode: 'ashta-siddhi-everloft',
    propertyName: 'Ashta Siddhi Cascade (Everloft Units)',
    tabNames: ['everloft astha siddhi income', 'ashta siddhi cascade expenses'],
    units: ['306', '403', '405', '406'],
    partnerSplitModel: 'standard_3way',
    everloftPartners: ['akhil', 'nikhil', 'jithin'],
  },
  {
    propertyCode: 'ashta-siddhi-navasthya',
    propertyName: 'Ashta Siddhi Cascade (Navasthya 50:50 Units)',
    tabNames: ['navasthya x everloft astha sidd', 'everloft x navastya expenses'],
    units: ['206', '305', '404'],
    partnerSplitModel: 'navasthya_50_50',
    everloftPartners: ['akhil', 'nikhil', 'jithin'],
    navasthyaShare: 0.50,
  },
  {
    propertyCode: 'syed-platinum',
    propertyName: 'Syed Platinum Palm (Pool Villa 507)',
    tabNames: ['platinum plams income', 'syed platinum plam expenses', '507'],
    units: ['507', 'VILLA', 'POOL VILLA'],
    partnerSplitModel: 'syed_platinum_10_fee',
    everloftPartners: ['akhil', 'nikhil'], // Jithin excluded for Syed Platinum Palm
    everloftFeeRate: 0.10,
  },
];

/**
 * Normalizes property code or tab name to standard asset config
 */
export function resolvePropertyAssetConfig(tabOrPropertyName: string, unitNo?: string): PropertyAssetConfig {
  const cleanInput = (tabOrPropertyName || '').trim().toLowerCase();
  const cleanUnit = (unitNo || '').trim().toUpperCase();

  // 1. Direct Unit Match for Ashta Siddhi
  if (cleanUnit) {
    if (['206', '305', '404'].includes(cleanUnit)) {
      return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'ashta-siddhi-navasthya')!;
    }
    if (['306', '403', '405', '406'].includes(cleanUnit)) {
      return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'ashta-siddhi-everloft')!;
    }
    if (['507'].includes(cleanUnit)) {
      return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'syed-platinum')!;
    }
  }

  // 2. Tab Name / Property Name Matching
  const match = PROPERTY_ASSET_CATALOG.find((config) =>
    config.tabNames.some((tab) => cleanInput.includes(tab) || tab.includes(cleanInput))
  );

  if (match) return match;

  // 3. Fallback Keyword Match
  if (cleanInput.includes('navast') || cleanInput.includes('206') || cleanInput.includes('305') || cleanInput.includes('404')) {
    return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'ashta-siddhi-navasthya')!;
  }
  if (cleanInput.includes('ashta') || cleanInput.includes('astha') || cleanInput.includes('cascade')) {
    return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'ashta-siddhi-everloft')!;
  }
  if (cleanInput.includes('platinum') || cleanInput.includes('507') || cleanInput.includes('syed')) {
    return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'syed-platinum')!;
  }
  if (cleanInput.includes('green')) {
    return PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'greenvista')!;
  }

  // Default to Pinnacle
  return PROPERTY_ASSET_CATALOG[0];
}

/**
 * Calculates profit distributions based on property partner rules
 */
export function calculateProfitDistribution(
  netPayout: number,
  config: PropertyAssetConfig
): ProfitDistributionResult {
  let navasthyaShareAmount = 0;
  let ownerShareAmount = 0;
  let everloftCompanyAmount = 0;
  const partnerDistribution: Record<string, number> = {};

  if (config.partnerSplitModel === 'navasthya_50_50') {
    // 50% to Navasthya, 50% to Everloft
    navasthyaShareAmount = netPayout * (config.navasthyaShare || 0.50);
    everloftCompanyAmount = netPayout - navasthyaShareAmount;

    // Everloft portion split equally among 3 partners
    const perPartner = everloftCompanyAmount / config.everloftPartners.length;
    for (const partner of config.everloftPartners) {
      partnerDistribution[partner] = Math.round(perPartner * 100) / 100;
    }
  } else if (config.partnerSplitModel === 'syed_platinum_10_fee') {
    // 10% fee to Everloft, 90% to Owner
    everloftCompanyAmount = netPayout * (config.everloftFeeRate || 0.10);
    ownerShareAmount = netPayout - everloftCompanyAmount;

    // Everloft 10% fee split equally ONLY between Akhil & Nikhil (2 partners)
    const perPartner = everloftCompanyAmount / config.everloftPartners.length;
    for (const partner of config.everloftPartners) {
      partnerDistribution[partner] = Math.round(perPartner * 100) / 100;
    }
  } else {
    // Standard 100% Everloft 3-way split
    everloftCompanyAmount = netPayout;
    const perPartner = everloftCompanyAmount / config.everloftPartners.length;
    for (const partner of config.everloftPartners) {
      partnerDistribution[partner] = Math.round(perPartner * 100) / 100;
    }
  }

  return {
    grossAmount: netPayout,
    netPayout,
    navasthyaShareAmount: Math.round(navasthyaShareAmount * 100) / 100,
    ownerShareAmount: Math.round(ownerShareAmount * 100) / 100,
    everloftCompanyAmount: Math.round(everloftCompanyAmount * 100) / 100,
    partnerDistribution,
  };
}
