import { describe, it, expect } from 'vitest';
import {
  resolvePropertyAssetConfig,
  calculateProfitDistribution,
  PROPERTY_ASSET_CATALOG,
} from './sheet-unit-parser';

describe('Everloft Google Sheet Asset & Unit Mapping Engine', () => {
  it('correctly resolves Ashta Siddhi Navasthya units (206, 305, 404)', () => {
    const config206 = resolvePropertyAssetConfig('Any Tab', '206');
    const config305 = resolvePropertyAssetConfig('Any Tab', '305');
    const config404 = resolvePropertyAssetConfig('Any Tab', '404');

    expect(config206.propertyCode).toBe('ashta-siddhi-navasthya');
    expect(config305.propertyCode).toBe('ashta-siddhi-navasthya');
    expect(config404.propertyCode).toBe('ashta-siddhi-navasthya');
    expect(config206.partnerSplitModel).toBe('navasthya_50_50');
  });

  it('correctly resolves Ashta Siddhi Everloft units (306, 403, 405, 406)', () => {
    const config306 = resolvePropertyAssetConfig('Any Tab', '306');
    const config403 = resolvePropertyAssetConfig('Any Tab', '403');
    const config405 = resolvePropertyAssetConfig('Any Tab', '405');
    const config406 = resolvePropertyAssetConfig('Any Tab', '406');

    expect(config306.propertyCode).toBe('ashta-siddhi-everloft');
    expect(config403.propertyCode).toBe('ashta-siddhi-everloft');
    expect(config405.propertyCode).toBe('ashta-siddhi-everloft');
    expect(config406.propertyCode).toBe('ashta-siddhi-everloft');
    expect(config306.partnerSplitModel).toBe('standard_3way');
  });

  it('correctly resolves Syed Platinum Palm (Unit 507)', () => {
    const config507 = resolvePropertyAssetConfig('Platinum Plams income', '507');
    expect(config507.propertyCode).toBe('syed-platinum');
    expect(config507.partnerSplitModel).toBe('syed_platinum_10_fee');
    expect(config507.everloftPartners).toEqual(['akhil', 'nikhil']);
  });

  it('calculates 50:50 Navasthya profit distribution accurately', () => {
    const config = PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'ashta-siddhi-navasthya')!;
    const distribution = calculateProfitDistribution(100000, config);

    expect(distribution.navasthyaShareAmount).toBe(50000);
    expect(distribution.everloftCompanyAmount).toBe(50000);
    expect(distribution.partnerDistribution['akhil']).toBeCloseTo(16666.67, 2);
    expect(distribution.partnerDistribution['nikhil']).toBeCloseTo(16666.67, 2);
    expect(distribution.partnerDistribution['jithin']).toBeCloseTo(16666.67, 2);
  });

  it('calculates Syed Platinum 10% fee distribution ONLY between Akhil & Nikhil (excluding Jithin)', () => {
    const config = PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'syed-platinum')!;
    const distribution = calculateProfitDistribution(100000, config);

    expect(distribution.everloftCompanyAmount).toBe(10000);
    expect(distribution.ownerShareAmount).toBe(90000);
    expect(distribution.partnerDistribution['akhil']).toBe(5000);
    expect(distribution.partnerDistribution['nikhil']).toBe(5000);
    expect(distribution.partnerDistribution['jithin']).toBeUndefined();
  });

  it('calculates standard 3-way split for Pinnacle and Greenvista', () => {
    const config = PROPERTY_ASSET_CATALOG.find((p) => p.propertyCode === 'pinnacle')!;
    const distribution = calculateProfitDistribution(90000, config);

    expect(distribution.everloftCompanyAmount).toBe(90000);
    expect(distribution.partnerDistribution['akhil']).toBe(30000);
    expect(distribution.partnerDistribution['nikhil']).toBe(30000);
    expect(distribution.partnerDistribution['jithin']).toBe(30000);
  });
});
