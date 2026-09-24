import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listProperties, listPublicActiveProperties } from './properties.service';
import * as adminModule from '@/lib/supabase/admin';

describe('Properties Listing Diagnostic & Unit Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('demonstrates that listProperties returns an empty array when database contains 0 property rows', async () => {
    // Mock Supabase admin client simulating an empty database (such as the current local/staging database)
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'property_types') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'type-1', slug: 'villa', name: 'Villa' }],
              error: null,
            }),
          };
        }
        if (table === 'property_status') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'status-1', slug: 'active', name: 'Active' }],
              error: null,
            }),
          };
        }
        if (table === 'properties') {
          const queryBuilder: Record<string, unknown> = {};
          queryBuilder.select = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.is = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.order = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.range = vi.fn().mockResolvedValue({
            data: [], // 0 properties returned from empty DB
            count: 0,
            error: null,
          });
          return queryBuilder;
        }
        if (table === 'property_photos') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === 'property_pricing') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    vi.spyOn(adminModule, 'createAdminClient').mockReturnValue(mockSupabase as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await listProperties({});
    expect(result.total).toBe(0);
    expect(result.properties).toEqual([]);
    expect(result.properties.length).toBe(0);
  });

  it('demonstrates that listPublicActiveProperties returns empty list when no active properties exist', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'property_status') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'status-active-id' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'properties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    vi.spyOn(adminModule, 'createAdminClient').mockReturnValue(mockSupabase as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const activeList = await listPublicActiveProperties(10);
    expect(activeList).toEqual([]);
    expect(activeList.length).toBe(0);
  });

  it('correctly maps property listings and cover photos when records exist in database', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'property_types') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'type-villa', slug: 'villa', name: 'Villa' }],
              error: null,
            }),
          };
        }
        if (table === 'property_status') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'status-active', slug: 'active', name: 'Active' }],
              error: null,
            }),
          };
        }
        if (table === 'properties') {
          const queryBuilder: Record<string, unknown> = {};
          queryBuilder.select = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.is = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.order = vi.fn().mockReturnValue(queryBuilder);
          queryBuilder.range = vi.fn().mockResolvedValue({
            data: [
              {
                id: 'prop-1',
                name: 'Villa Zephyr',
                slug: 'villa-zephyr',
                internal_code: 'VZ-01',
                city: 'Goa',
                type_id: 'type-villa',
                status_id: 'status-active',
                owner_id: null,
                managed_by: null,
                max_guests: 8,
              },
            ],
            count: 1,
            error: null,
          });
          return queryBuilder;
        }
        if (table === 'property_photos') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [{ property_id: 'prop-1', file_id: 'file-cover-1', is_cover: true }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'files') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'file-cover-1',
                    public_url: 'https://images.everloft.co.in/villa-zephyr-cover.jpg',
                    bucket: 'photos',
                    object_key: 'villa-zephyr.jpg',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'property_owners') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'property_pricing') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ property_id: 'prop-1', base_price: 25000 }],
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    vi.spyOn(adminModule, 'createAdminClient').mockReturnValue(mockSupabase as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await listProperties({});
    expect(result.total).toBe(1);
    expect(result.properties.length).toBe(1);
    expect(result.properties[0].name).toBe('Villa Zephyr');
    expect(result.properties[0].coverImageUrl).toBe('https://images.everloft.co.in/villa-zephyr-cover.jpg');
    expect(result.properties[0].completionScore).toBe(100);
    expect(result.properties[0].statusName).toBe('Active');
  });
});
