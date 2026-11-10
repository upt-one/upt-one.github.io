import { describe, it, expect } from 'vitest'
import { feedDay, date_diff_indays } from './frtl-utility.js'

// vitest.config.mjs runs every test in central time, one hour west of the feed's eastern
// stamps (#30). the first test fails if that ever stops holding.
const stamp = '2026-05-16T00:30:00-04:00'

describe('feed dates for a viewer west of eastern time', () => {
  it('runs in a zone where Date() lands on the day before', () => {
    expect(new Date(stamp).getDate()).toBe(15)
  })

  it('feedDay keeps the feed day', () => {
    const d = feedDay(stamp)
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 4, 16])
  })

  it('feedDay passes a Date through as the same moment', () => {
    const d = new Date(2026, 4, 16, 9)
    expect(feedDay(d).getTime()).toBe(d.getTime())
  })

  it('date_diff_indays counts from the feed day', () => {
    expect(date_diff_indays(stamp, new Date(2026, 4, 17, 12))).toBe(1)
  })
})
