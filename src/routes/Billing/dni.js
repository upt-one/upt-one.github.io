// the do-not-invoice reason bits, from the feed's errormask. the cards and the csv both read this.
export const FlagMaps = [
  { title: 'No Freight BOLs', flag: 1 },
  { title: 'A Freight BOL is missing', flag: 2 },
  { title: 'A Freight BOL is not Alphanumeric', flag: 4 },
  { title: 'A Freight BOL is too short', flag: 8 },
  { title: 'A Freight has Zero Gallons', flag: 16 },
  { title: 'Freight/Order mismatch', flag: 32 },
  { title: 'A Freight has 300 Gross Gallons', flag: 64 },
  { title: 'RefNum of all 0s found', flag: 128 },
  { title: 'Review Reason Field', flag: 256 },
  { title: 'Bad RaceTrac PO', flag: 512 },
  { title: 'Bad Equipment', flag: 1024 },
  { title: 'Bad Division/Terminal', flag: 2048 },
]

export const getReasons = (mask) => {
  const reasons = FlagMaps.filter((x) => (mask & x.flag) === x.flag).map((x) => x.title)
  return reasons.length === 0 ? ['Unknown'] : reasons
}

// one csv row per order, the reasons joined into the last column
export const dniCsvRow = ({ errormask, ...row }) => ({
  ...row,
  reasons: getReasons(errormask).join('; '),
})
