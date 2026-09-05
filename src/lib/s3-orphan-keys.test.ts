import { describe, expect, it } from 'vitest'

import { buildStoredKeys } from '@/lib/s3-orphan-keys'

describe('buildStoredKeys', () => {
  it('builds the key from the stored prefix and filename', () => {
    // Measured on the dev database on 2026-09-05.
    expect(
      buildStoredKeys({ filename: '1761654912918-D_Auditplan-1.xlsm', prefix: 'documents/17' }),
    ).toEqual({ keys: ['documents/17/1761654912918-D_Auditplan-1.xlsm'], unbuildable: false })
  })

  it('handles a prefix without an organisation segment', () => {
    expect(
      buildStoredKeys({ filename: 'D_rahmenkonzept.pdf', prefix: 'documents-public' }),
    ).toEqual({ keys: ['documents-public/D_rahmenkonzept.pdf'], unbuildable: false })
  })

  it('keeps a legacy prefix verbatim', () => {
    // A row at `documents/null` or at a doubled prefix points at a real object.
    expect(buildStoredKeys({ filename: 'a.pdf', prefix: 'documents/null' }).keys).toEqual([
      'documents/null/a.pdf',
    ])
    expect(buildStoredKeys({ filename: 'a.pdf', prefix: 'documents/18/18' }).keys).toEqual([
      'documents/18/18/a.pdf',
    ])
  })

  it('adds one key per size variant, under the same prefix', () => {
    const result = buildStoredKeys({
      filename: 'chart.png',
      prefix: 'media/4',
      sizes: {
        card: { filename: 'chart-768x1024.png' },
        thumbnail: { filename: 'chart-200x200.png' },
      },
    })

    expect(result.keys).toEqual([
      'media/4/chart.png',
      'media/4/chart-768x1024.png',
      'media/4/chart-200x200.png',
    ])
    expect(result.unbuildable).toBe(false)
  })

  it('ignores an unset size variant', () => {
    const result = buildStoredKeys({
      filename: 'chart.png',
      prefix: 'media/4',
      sizes: { card: { filename: null }, thumbnail: null },
    })

    expect(result.keys).toEqual(['media/4/chart.png'])
    expect(result.unbuildable).toBe(false)
  })

  it('trims the surrounding slashes of the prefix', () => {
    expect(buildStoredKeys({ filename: 'a.pdf', prefix: '/documents/4/' }).keys).toEqual([
      'documents/4/a.pdf',
    ])
  })

  it('reports a row that names a file it cannot place', () => {
    // The whole scan must read as incomplete. An unbuilt key makes a live object read as an orphan.
    expect(buildStoredKeys({ filename: 'a.pdf', prefix: null })).toEqual({
      keys: [],
      unbuildable: true,
    })
    expect(buildStoredKeys({ filename: 'a.pdf', prefix: '' })).toEqual({
      keys: [],
      unbuildable: true,
    })
  })

  it('does not report a row that names no file', () => {
    expect(buildStoredKeys({ filename: null, prefix: 'documents/4' })).toEqual({
      keys: [],
      unbuildable: false,
    })
    expect(buildStoredKeys({})).toEqual({ keys: [], unbuildable: false })
  })
})
