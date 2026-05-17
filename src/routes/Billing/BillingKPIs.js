import {
  number_format,
  date_diff_indays,
  sumBy,
  countBy,
  sumByMany
} from '$lib/frtl-utility'

export const getKPIs = async (d) => {

  const fd0 = x => new Date(x)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fic0 = x => `${x.length}`
  const fic1 = x => `$${(x.reduce((a, { ivh_totalcharge: b }) => a + b, 0) / 1000).toFixed(0)}k`.replace('$0','<$1')
  const fic2 = x => `${fic0(x)} (${fic1(x)})`
  const fic3 = x => `$${(x.reduce((a, { pyd_amount: b }) => a + b, 0) / 1000).toFixed(0)}k`.replace('$0','<$1')
  const fic4 = x => `${fic0(x)} (${fic3(x)})`

  const json = d
  const LostAccessorials = json.BillingV1.LostAccessorialsV1.map(x => ({...x, Date: x.ivh_billdate.substring(0,10)}))
  const DriverScans = json.EbeV1.MobileCaptureV1
  const ManualCompletions = json.BillingV1.ManualCompletionsV1
  const NonCompletions = json.BillingV1.NonCompletionsV1
  const LateCompletions = json.BillingV1.LateCompletionsV1
  const fis = (s) => (a) => a.ivh_invoicestatus === s // filter for invoice status s
  const InvoicesHLD = json.BillingV1.InvoicesV1.filter(fis('HLD'))
  const InvoicesHLA = json.BillingV1.InvoicesV1.filter(fis('HLA'))
  const ebeMissingPaperwork = json.EbeV1.MissingPaperworkV1
  const ebeMissingPaperworkOld = ebeMissingPaperwork.filter(
    (x) => date_diff_indays(x.ord_completiondate, json.BillingV1.tds) > 3,
  )
  const Orders = json.BillingV1.OrdersV1
  const OrdersOld = Orders.filter(
    (x) => date_diff_indays(x.ord_completiondate, json.BillingV1.tds) > 3,
  )
  const Unrateable = json.BillingV1.UnrateableV1
  const InvoicesHLDOld = InvoicesHLD.filter(
    (x) => date_diff_indays(x.ivh_deliverydate, json.BillingV1.tds) > 8,
  )
  const InvoicesOld = Object.values(InvoicesHLDOld)
  const InvoicesHLDYoung = InvoicesHLD.filter((x) =>
    [5, 6, 7, 8].includes(
      date_diff_indays(x.ivh_deliverydate, json.BillingV1.tds),
    ),
  )
  const InvoicesYoung = Object.values(InvoicesHLDYoung)

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
    tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
    kfil: 'ord_revtype1',
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
    tsum: (x) => sumBy(x, 'ivh_revtype1', 'ivh_totalcharge'),
    kfil: 'ivh_revtype1',
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
      tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
      kfil: 'ord_revtype1',
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
      tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
      kfil: 'ord_revtype1',
    },
    {
      KPI: 'Order Completion Success',
      Current: `${(() => {
        const rows = ManualCompletions
        const mcc = rows
          .map(x => parseInt(x.ManualCompletionCount))
          .reduce((a, b) => a + b)
        const tc = rows
          .map(x => parseInt(x.TotalCount))
          .reduce((a, b) => a + b)
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
      tsum: (x) => sumByMany(x, 'Terminal', 'ManualCompletionCount', 'TotalCount')
        .map(x => ({
          key: x.Terminal,
          SuccessCount: x.TotalCount - x.ManualCompletionCount,
          //SuccessRate is the same as val, but including it here to use as a named value later
          //key/val are just standardized naming with all of the other KPIs since most use a diff function to sum/count
          SuccessRate: Math.round(100.0 * (x.TotalCount - x.ManualCompletionCount) / x.TotalCount),
          ...x
        })).sort((a, b) => b.SuccessRate - a.SuccessRate),
      kfil: 'Terminal',
      isDriverStats: true
    },
    {
      KPI: 'Mobile Capture Success',
      Current:
        `${(DriverScans.map(x => parseInt(x.DriverScanCount))
          .reduce((a, b) => a + b) * 100.0 /
          DriverScans.map(x => parseInt(x.TotalCount))
            .reduce((a, b) => a + b)).toFixed(0)}%`
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
      tsum: (x) => sumByMany(x, 'Terminal', 'DriverScanCount', 'TotalCount')
        .map(x => ({
          key: x.Terminal,
          SuccessCount: x.DriverScanCount,
          //SuccessRate is the same as val, but including it here to use as a named value later
          //key/val are just standardized naming with all of the other KPIs since most use a diff function to sum/count
          SuccessRate: Math.round(100.0 * x.DriverScanCount / x.TotalCount),
          ...x
        })).sort((a, b) => b.SuccessRate - a.SuccessRate),
      kfil: 'Terminal',
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
      tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
      kfil: 'ord_revtype1',
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
      tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
      kfil: 'ord_revtype1',
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
        ivh_revtype1: x.ivh_revtype1,
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
      tsum: (x) => countBy(x, 'ord_revtype1', 'ord_hdrnumber'),
      kfil: 'ord_revtype1',
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