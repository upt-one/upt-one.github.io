import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

// real mode, a two-file listing from graph, and a zip reader that can be told to fail per file
vi.mock('./env', () => ({ useMock: false, useLocalData: false }))
vi.mock('./graph', () => ({ callMSGraph: vi.fn() }))
vi.mock('unzipit', () => ({ unzipRaw: vi.fn() }))
vi.mock('./mock', () => ({ mockData: {} }))

// node's own localStorage global shadows happy-dom's and is undefined without a file, so stub one
const store = new Map()
vi.stubGlobal('localStorage', {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
})

import { getData, data } from './data.js'
import { callMSGraph } from './graph'
import { unzipRaw } from 'unzipit'

const file = (name) => ({
  name,
  lastModifiedDateTime: '2026-11-11T12:00:00Z',
  '@microsoft.graph.downloadUrl': `https://example.test/${name}`,
})
const zipOf = (json) => ({ entries: [{ json: async () => json }] })

beforeEach(() => {
  localStorage.clear()
  data.set(null)
  callMSGraph.mockResolvedValue([file('billing.zip'), file('operations.zip')])
})

describe('getData', () => {
  it('loads every file', async () => {
    unzipRaw.mockImplementation(async (url) =>
      url.endsWith('billing.zip') ? zipOf({ BillingV1: { a: 1 } }) : zipOf({ OperationsV1: { b: 2 } }))
    await getData('token')
    expect(Object.keys(get(data))).toEqual(['BillingV1', 'OperationsV1'])
  })

  it('skips a file that fails to download and keeps the rest (#29)', async () => {
    unzipRaw.mockImplementation(async (url) => {
      if (url.endsWith('billing.zip')) throw new Error('corrupt zip')
      return zipOf({ OperationsV1: { b: 2 } })
    })
    await getData('token')
    expect(get(data)).toEqual({ OperationsV1: { b: 2 } })
  })

  it('still sets data when every file fails, so each card shows its own error', async () => {
    unzipRaw.mockRejectedValue(new Error('expired url'))
    await getData('token')
    expect(get(data)).toEqual({})
  })
})
