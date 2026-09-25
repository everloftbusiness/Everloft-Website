import { describe, it, expect } from 'vitest';
import {
  isExactBookingDuplicate,
  buildBatchDeduplicationKey,
  type ExistingBookingRecord,
  type IncomingBookingCandidate,
} from './duplicate-detector';

describe('Duplicate Detector - Comprehensive Multi-Factor Matching', () => {
  const baseExisting: ExistingBookingRecord = {
    id: 'b-1',
    property_id: 'prop-pinnacle',
    guest_name: 'Amal Johny',
    check_in_date: '2025-05-20',
    check_out_date: '2025-05-21',
    unit_label: 'Whole Villa',
    guest_total: 3279.06,
    host_total: 2392.00,
    accounts: new Set(['everloft - kgb']),
  };

  const baseIncoming: IncomingBookingCandidate = {
    propertyId: 'prop-pinnacle',
    guestName: 'Amal Johny',
    checkInDate: '2025-05-20',
    unitLabel: 'Whole Villa',
    guestTotal: 3279.06,
    hostTotal: 2392.00,
    amountCreditedBank: 'EVERLOFT - KGB',
  };

  it('identifies exact duplicate when name, date, price, account, and room all match', () => {
    expect(isExactBookingDuplicate(baseIncoming, baseExisting)).toBe(true);
  });

  it('does NOT mark as duplicate when same guest and same date has a DIFFERENT AMOUNT (additional transaction / add-on)', () => {
    const additionalAmountIncoming: IncomingBookingCandidate = {
      ...baseIncoming,
      guestTotal: 500.00,
      hostTotal: 450.00, // Different amount!
    };

    expect(isExactBookingDuplicate(additionalAmountIncoming, baseExisting)).toBe(false);
  });

  it('does NOT mark as duplicate when same guest and same date has a DIFFERENT ACCOUNT (different bank transaction)', () => {
    const differentAccountIncoming: IncomingBookingCandidate = {
      ...baseIncoming,
      amountCreditedBank: 'HDFC BANK', // Different bank account!
    };

    expect(isExactBookingDuplicate(differentAccountIncoming, baseExisting)).toBe(false);
  });

  it('does NOT mark as duplicate when same guest and same date books a DIFFERENT ROOM', () => {
    const existingWithRoom: ExistingBookingRecord = {
      ...baseExisting,
      unit_label: 'Room 101',
    };
    const incomingDifferentRoom: IncomingBookingCandidate = {
      ...baseIncoming,
      unitLabel: 'Room 102', // Different room!
    };

    expect(isExactBookingDuplicate(incomingDifferentRoom, existingWithRoom)).toBe(false);
  });

  it('treats generic room labels like "Whole Villa" and empty string as compatible', () => {
    const incomingEmptyRoom: IncomingBookingCandidate = {
      ...baseIncoming,
      unitLabel: '',
    };

    expect(isExactBookingDuplicate(incomingEmptyRoom, baseExisting)).toBe(true);
  });

  it('builds distinct batch deduplication keys for different amounts of same guest on same day', () => {
    const row1: IncomingBookingCandidate = {
      propertyId: 'prop-1',
      guestName: 'Rahul Sharma',
      checkInDate: '2025-06-10',
      guestTotal: 5000,
      hostTotal: 4600,
      amountCreditedBank: 'KGB',
    };

    const row2DifferentAmount: IncomingBookingCandidate = {
      ...row1,
      guestTotal: 1500, // Different amount
      hostTotal: 1350,
    };

    const row3DifferentAccount: IncomingBookingCandidate = {
      ...row1,
      amountCreditedBank: 'HDFC', // Different account
    };

    const key1 = buildBatchDeduplicationKey(row1);
    const key2 = buildBatchDeduplicationKey(row2DifferentAmount);
    const key3 = buildBatchDeduplicationKey(row3DifferentAccount);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });

  it('builds identical batch deduplication key for truly identical rows', () => {
    const row1: IncomingBookingCandidate = {
      propertyId: 'prop-1',
      guestName: 'Rahul Sharma',
      checkInDate: '2025-06-10',
      guestTotal: 5000,
      hostTotal: 4600,
      amountCreditedBank: 'KGB',
    };

    const rowIdentical: IncomingBookingCandidate = {
      propertyId: 'prop-1',
      guestName: 'rahul sharma ',
      checkInDate: '2025-06-10',
      guestTotal: 5000.00,
      hostTotal: 4600.00,
      amountCreditedBank: 'kgb',
    };

    expect(buildBatchDeduplicationKey(row1)).toBe(buildBatchDeduplicationKey(rowIdentical));
  });
});
