import {
  number_format,
  date_diff_indays,
  sumBy,
  countBy,
  sumByMany
} from '$lib/frtl-utility'

export const getKPIs = async (d, division = '') => {

  // #46. The feeds emit RAW db column names in V2: ord_revtype1/ivh_revtype1 = the COMPANY
  // (division), ord_revtype2/ivh_revtype2 = the TERMINAL. V1 shipped the terminal under the
  // revtype1 name (pre-merger there was only one company, so the label was cosmetic) and has
  // no company at all. Prefer V2, fall back to V1 while the feeds roll out (expand and
  // contract, docs/architecture.md). Naming stays db-truth end to end; "Terminal" is a UI
  // label applied at render, never a renamed data column.
  const pick = (ds, name) => ds?.[`${name}V2`] ?? ds?.[`${name}V1`] ?? []
  const isV2 = (ds, name) => ds?.[`${name}V2`] !== undefined

  // On V2 the terminal is revtype2; on V1 it is (mislabeled) revtype1. Drilldown grouping
  // reads whichever this payload actually carries.
  const ordTerminal = isV2(d.BillingV1, 'Orders') ? 'ord_revtype2' : 'ord_revtype1'
  const ivhTerminal = isV2(d.BillingV1, 'Invoices') ? 'ivh_revtype2' : 'ivh_revtype1'
  const ebeTerminal = isV2(d.EbeV1, 'MissingPaperwork') ? 'ord_revtype2' : 'ord_revtype1'
  // the per-driver rollups: V1 aliased the terminal to [Terminal], V2 emits ord_revtype2 raw
  const mcTerminal = isV2(d.BillingV1, 'ManualCompletions') ? 'ord_revtype2' : 'Terminal'
  const mcapTerminal = isV2(d.EbeV1, 'MobileCapture') ? 'ord_revtype2' : 'Terminal'

  // Division filter: only V2 rows carry the company, so V1 payloads pass through untouched
  // and the page behaves exactly as it does today.
  const byDiv = (rows, field = 'ord_revtype1') =>
    division && rows.length && rows[0][field] !== undefined && rows[0].__v2
      ? rows.filter((r) => r[field] === division)
      : rows
  const tag = (rows, v2) => (v2 ? rows.map((r) => ({ ...r, __v2: true })) : rows)

  const fd0 = x => new Date(x)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fic0 = x => `${x.length}`
  const fic1 = x => `$${(x.reduce((a, { ivh_totalcharge: b }) => a + b, 0) / 1000).toFixed(0)}k`.replace('$0','<$1')
  const fic2 = x => `${fic0(x)} (${fic1(x)})`
  const fic3 = x => `$${(x.reduce((a, { pyd_amount: b }) => a + b, 0) / 1000).toFixed(0)}k`.replace('$0','<$1')
  const fic4 = x => `${fic0(x)} (${fic3(x)})`

  const json = d
  const LostAccessorials = byDiv(tag(pick(json.BillingV1, 'LostAccessorials'), isV2(json.BillingV1, 'LostAccessorials')), 'ivh_revtype1')
    .map(x => ({...x, Date: x.ivh_billdate.substring(0,10)}))
  const DriverScans = byDiv(tag(pick(json.EbeV1, 'MobileCapture'), isV2(json.EbeV1, 'MobileCapture')))
  const ManualCompletions = byDiv(tag(pick(json.BillingV1, 'ManualCompletions'), isV2(json.BillingV1, 'ManualCompletions')))
  const NonCompletions = byDiv(tag(pick(json.BillingV1, 'NonCompletions'), isV2(json.BillingV1, 'NonCompletions')))
  const LateCompletions = byDiv(tag(pick(json.BillingV1, 'LateCompletions'), isV2(json.BillingV1, 'LateCompletions')))
  // Single pass over InvoicesV1 — bucket by status + age. Replaces four
  // .filter chains over ~10k rows (HLD, HLA, HLD>8d, HLD 5-8d) with one
  // loop that also calls date_diff_indays once per HLD row instead of twice.
  const tds = json.BillingV1.tds
  const InvoicesHLD = [], InvoicesHLA = [], InvoicesHLDOld = [], InvoicesHLDYoung = []
  for (const inv of byDiv(tag(pick(json.BillingV1, 'Invoices'), isV2(json.BillingV1, 'Invoices')), 'ivh_revtype1')) {
    if (inv.ivh_invoicestatus === 'HLA') {
      InvoicesHLA.push(inv)
    } else if (inv.ivh_invoicestatus === 'HLD') {
      InvoicesHLD.push(inv)
      const age = date_diff_indays(inv.ivh_deliverydate, tds)
      if (age > 8) InvoicesHLDOld.push(inv)
      else if (age >= 5 && age <= 8) InvoicesHLDYoung.push(inv)
    }
  }
  const InvoicesOld = InvoicesHLDOld      // Object.values() was redundant — already an array
  const InvoicesYoung = InvoicesHLDYoung

  const ebeMissingPaperwork = byDiv(tag(pick(json.EbeV1, 'MissingPaperwork'), isV2(json.EbeV1, 'MissingPaperwork')))
  const ebeMissingPaperworkOld = ebeMissingPaperwork.filter(
    (x) => date_diff_indays(x.ord_completiondate, tds) > 3,
  )
  const Orders = byDiv(tag(pick(json.BillingV1, 'Orders'), isV2(json.BillingV1, 'Orders')))
  const OrdersOld = Orders.filter(
    (x) => date_diff_indays(x.ord_completiondate, tds) > 3,
  )
  const Unrateable = byDiv(tag(pick(json.BillingV1, 'Unrateable'), isV2(json.BillingV1, 'Unrateable')))

  //all order kpis use these settings
  const dnikpis = {
    hdrs: 'Number,BillTo,Shipper,Consignee,Delivered,Driver1'.split(
      ',',
    ),
    mapf: (x) => ({
      ord_hdrnumber: x.ord_hdrnumber,
      ord_billto: x.ord_billto,
      ord_shipper: x.ord_shipper,
      ord_consignee: x.ord_consignee,
      ord_completiondate: fd0(x.ord_completiondate),
      ord_driver1: x.ord_driver1,
      errormask: x.reason,
    }),
    sumv: tt => `${tt.val.toFixed(0)}`,
    isDNI: true,
    tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
    kfil: ordTerminal,
    mpf: 'ord_hdrnumber', //Missing Paperwork search Field
    showMPS: true,
  }

  //all invoice kpis use these settings
  const invoicekpis = {
    hdrs: 'Number,Status,BillTo,Shipper,Consignee,Shipped,Delivered,Total,Qty,Ref_Num'.split(
      ',',
    ),
    mapf: (x) => ({
      ivh_invoicenumber: x.ivh_invoicenumber,
      ivh_invoicestatus: x.ivh_invoicestatus,
      ivh_billto: x.ivh_billto,
      ivh_shipper: x.ivh_shipper,
      ivh_consignee: x.ivh_consignee,
      ivh_shipdate: fd0(x.ivh_shipdate),
      ivh_deliverydate: fd0(x.ivh_deliverydate),
      ivh_totalcharge: x.ivh_totalcharge.toFixed(2),
      ivh_quantity: x.ivh_quantity,
      ref_number: x.ref_number,
    }),
    sumv: (tt, rows) => `$${number_format(tt.val, 2)} (${rows.length})`,
    isInvoice: true,
    tsum: (x) => sumBy(x, ivhTerminal, 'ivh_totalcharge'),
    kfil: ivhTerminal,
    thdr: 'Amount (Count)',
    mpf: 'ivh_invoicenumber', //Missing Paperwork search Field
  }

  //create kpi array with settings, merge in order and invoice kpis when appropriate
  const kpis = [
    {
      KPI: 'Non-Completions (45 days)',
      Current: `${NonCompletions.length}`,
      Goal: '20',
      rt: 'aciBilling10',
      rows: NonCompletions,
      thdr: 'Count',
      hdrs: 'Age,Number,BillTo,CompletionDate,Driver1,Status,InvStatus'.split(
        ',',
      ),
      mapf: (x) => ({
        age: x.age,
        ord_hdrnumber: x.ord_hdrnumber,
        ord_billto: x.ord_billto,
        ord_completiondate: fd0(x.ord_completiondate),
        ord_driver1: x.ord_driver1,
        ord_status: x.ord_status,
        ord_invoicestatus: x.ord_invoicestatus,
      }),
      sumv: tt => `${tt.val.toFixed(0)}`,
      tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
      kfil: ordTerminal,
    },
    {
      KPI: 'Late Completions (45 days)',
      Current: `${LateCompletions.length}`,
      Goal: '350',
      rt: 'aciBilling11',
      rows: LateCompletions,
      thdr: 'Count',
      hdrs: 'Age,Number,BillTo,Driver1,Completed,Updated,Note,UpdatedBy'.split(
        ',',
      ),
      mapf: (x) => ({
        age: x.age,
        ord_hdrnumber: x.ord_hdrnumber,
        ord_billto: x.ord_billto,
        ord_driver1: x.ord_driver1,
        ord_completiondate: fd0(x.ord_completiondate),
        updated_dt: fd0(x.updated_dt),
        update_note: x.update_note,
        updated_by: x.updated_by,
      }),
      sumv: tt => `${tt.val.toFixed(0)}`,
      tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
      kfil: ordTerminal,
    },
    {
      KPI: 'Order Completion Success',
      Current: `${(() => {
        const rows = ManualCompletions
        const mcc = rows
          .map(x => parseInt(x.ManualCompletionCount))
          .reduce((a, b) => a + b, 0)
        const tc = rows
          .map(x => parseInt(x.TotalCount))
          .reduce((a, b) => a + b, 0) || 1 // a filter can empty this set; avoid NaN%
        const mcpct = (mcc * 100.0 / tc).toFixed(0)
        //return `(${mcc}/${tc}) ${mcpct}%`
        return `${100 - mcpct}%`
      })()}`
      ,
      Goal: '95%',
      rt: 'aciBilling7v2',
      rows: ManualCompletions,
      hdrs: 'Driver,ManualCompletionCount,TotalCount'.split(
        ',',
      ),
      mapf: x => ({
        SuccessCount: x.TotalCount - x.ManualCompletionCount,
        SuccessRate: Math.round(100.0 * (x.TotalCount - x.ManualCompletionCount) / x.TotalCount),
        ...x
      }),
      sumv: tt => `(${tt.SuccessCount}/${tt.TotalCount}) ${tt.SuccessRate.toFixed(0)}%`,
      thdr: 'Order Completion Success',
      tsum: (x) => sumByMany(x, mcTerminal, 'ManualCompletionCount', 'TotalCount')
        .map(x => ({
          key: x[mcTerminal],
          SuccessCount: x.TotalCount - x.ManualCompletionCount,
          //SuccessRate is the same as val, but including it here to use as a named value later
          //key/val are just standardized naming with all of the other KPIs since most use a diff function to sum/count
          SuccessRate: Math.round(100.0 * (x.TotalCount - x.ManualCompletionCount) / x.TotalCount),
          ...x
        })).sort((a, b) => b.SuccessRate - a.SuccessRate),
      kfil: mcTerminal,
      isDriverStats: true
    },
    {
      KPI: 'Mobile Capture Success',
      Current:
        `${(DriverScans.map(x => parseInt(x.DriverScanCount))
          .reduce((a, b) => a + b, 0) * 100.0 /
          (DriverScans.map(x => parseInt(x.TotalCount))
            .reduce((a, b) => a + b, 0) || 1)).toFixed(0)}%`
      ,
      Goal: '95%',
      rt: 'aciBilling9',
      rows: DriverScans,
      hdrs: 'Driver,DriverScanCount,TotalCount'.split(
        ',',
      ),
      mapf: x => ({
        SuccessCount: x.DriverScanCount,
        SuccessRate: Math.round(100.0 * x.DriverScanCount / x.TotalCount),
        ...x
      }),
      sumv: tt => `${tt.SuccessRate.toFixed(0)}%`,
      thdr: 'Driver Scan %',
      tsum: (x) => sumByMany(x, mcapTerminal, 'DriverScanCount', 'TotalCount')
        .map(x => ({
          key: x[mcapTerminal],
          SuccessCount: x.DriverScanCount,
          //SuccessRate is the same as val, but including it here to use as a named value later
          //key/val are just standardized naming with all of the other KPIs since most use a diff function to sum/count
          SuccessRate: Math.round(100.0 * x.DriverScanCount / x.TotalCount),
          ...x
        })).sort((a, b) => b.SuccessRate - a.SuccessRate),
      kfil: mcapTerminal,
      isDriverStats: true
    },
    {
      KPI: 'Missing Paperwork > 3 Days',
      Current: ebeMissingPaperworkOld.length,
      Goal: '< 50',
      rt: 'aciBilling2a',
      rows: ebeMissingPaperworkOld,
      thdr: 'Amount (Count)',
      hdrs: 'Number,InvStatus,BillTo,Shipper,Consignee,Delivered,Driver1,Missing'.split(
        ',',
      ),
      mapf: (x) => ({
        ord_hdrnumber: x.ord_hdrnumber,
        ord_invoicestatus: x.ord_invoicestatus,
        ord_billto: x.ord_billto,
        ord_shipper: x.ord_shipper,
        ord_consignee: x.ord_consignee,
        ord_completiondate: fd0(x.ord_completiondate),
        ord_driver1: x.ord_driver1,
        missing: x.missing,
      }),
      sumv: tt => `${tt.val.toFixed(0)}`,
      isOrder: true,
      tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
      kfil: ordTerminal,
      mpf: 'ord_hdrnumber'
    },
    {
      KPI: 'Missing Paperwork - Total',
      Current: ebeMissingPaperwork.length,
      Goal: '< 350',
      rt: 'aciBilling2a',
      rows: ebeMissingPaperwork,
      thdr: 'Amount (Count)',
      hdrs: 'Number,InvStatus,BillTo,Shipper,Consignee,Delivered,Driver1,Missing'.split(
        ',',
      ),
      mapf: (x) => ({
        ord_hdrnumber: x.ord_hdrnumber,
        ord_invoicestatus: x.ord_invoicestatus,
        ord_billto: x.ord_billto,
        ord_shipper: x.ord_shipper,
        ord_consignee: x.ord_consignee,
        ord_completiondate: fd0(x.ord_completiondate),
        ord_driver1: x.ord_driver1,
        missing: x.missing,
      }),
      sumv: tt => `${tt.val.toFixed(0)}`,
      isOrder: true,
      tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
      kfil: ordTerminal,
      mpf: 'ord_hdrnumber'
    },
    {
      KPI: 'Lost Accessorials',
      Current: fic4(LostAccessorials),
      Goal: '0',
      rt: 'aciBilling13',
      rows: LostAccessorials,
      hdrs: 'Terminal,BillTo,Invoice#,Description,Qty,Amount,Who,When,Status'.split(
        ',',
      ),
      mapf: (x) => ({
        ivh_revtype1: x[ivhTerminal],
        ivh_billto: x.ivh_billto,
        ivh_invoicenumber: x.ivh_invoicenumber,
        pyt_description: x.pyt_description,
        pyd_quantity: x.pyd_quantity,
        pyd_amount: x.pyd_amount,
        pyd_createdby: x.pyd_createdby,
	      pyd_createdon: fd0(x.pyd_createdon),
	      ivh_invoicestatus: x.ivh_invoicestatus
      }),
      sumv: (tt, rows) => `$${number_format(tt.val, 2)} (${rows.length})`,
      thdr: 'Amount (Count)',
      tsum: (x) => sumBy(x, 'Date', 'pyd_amount').sort((a,b)=>b.key.localeCompare(a.key)),
      kfil: 'Date',
    },
    {
      ...{
        KPI: 'Do Not Invoice > 3 Days',
        Current: `${OrdersOld.length}`,
        Goal: '= 0',
        rt: 'aciBilling5',
        rows: OrdersOld,
        thdr: 'Count',
      },
      ...dnikpis,
    },
    {
      ...{
        KPI: 'Do Not Invoice - Total',
        Current: `${Orders.length}`,
        Goal: '< 50',
        rt: 'aciBilling5',
        rows: Orders,
        thdr: 'Count',
      },
      ...dnikpis,
    },
    {
      KPI: 'Unable to be Rated',
      Current: `${Unrateable.length}`,
      Goal: '',
      rt: 'aciBilling8',
      rows: Unrateable,
      thdr: 'Count',
      hdrs: 'Number,BillTo,Shipper,Consignee,Delivered,Driver1'.split(
        ',',
      ),
      mapf: (x) => ({
        ord_hdrnumber: x.ord_hdrnumber,
        ord_billto: x.ord_billto,
        ord_shipper: x.ord_shipper,
        ord_consignee: x.ord_consignee,
        ord_completiondate: fd0(x.ord_completiondate),
        ord_driver1: x.ord_driver1,
      }),
      sumv: tt => `${tt.val.toFixed(0)}`,
      isOrder: true,
      tsum: (x) => countBy(x, ordTerminal, 'ord_hdrnumber'),
      kfil: ordTerminal,
      mpf: 'ord_hdrnumber', //Missing Paperwork search Field
      showMPS: true,
    },
    {
      ...{
        KPI: 'On Hold for Audit',
        Current: fic0(InvoicesHLA),
        Goal: '< 50',
        rt: 'aciBilling4',
        rows: InvoicesHLA,
        showMPS: true,
      },
      ...invoicekpis,
    },
    {
      ...{
        KPI: 'Unbilled older than 1 week',
        Current: fic2(InvoicesOld),
        Goal: '< 60',
        rt: 'aciBilling6',
        rows: InvoicesOld,
        showMPS: true,
      },
      ...invoicekpis,
    },
    {
      ...{
        KPI: 'Unbilled 4-7 Days Old',
        Current: fic2(InvoicesYoung),
        Goal: '< 250',
        rt: 'aciBilling6a',
        rows: InvoicesYoung,
        showMPS: true,
      },
      ...invoicekpis,
    },
    {
      ...{
        KPI: 'Unbilled Revenue - Total',
        Current: fic1(InvoicesHLD),
        Goal: '< $350k',
        rt: 'aciBilling1',
        rows: InvoicesHLD,
        showMPS: true,
      },
      ...invoicekpis,
    },
  ]

  return kpis
}