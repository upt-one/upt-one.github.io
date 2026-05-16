<script>
    import { data } from '$lib/data.js'
    import { isMP,hasOne } from '$lib/frtl-utility';
    const json = $data
    export let rows;
    export let kpi;
    const FlagMaps = [
            { title: "No Freight BOLs", flag: 1 },
            { title: "A Freight BOL is missing", flag: 2 },
            { title: "A Freight BOL is not Alphanumeric", flag: 4 },
            { title: "A Freight BOL is too short", flag: 8 },
            { title: "A Freight has Zero Gallons", flag: 16 },
            { title: "Freight/Order mismatch", flag: 32 },
            { title: "A Freight has 300 Gross Gallons", flag: 64 },
            { title: "RefNum of all 0s found", flag: 128 },
            { title: "Review Reason Field", flag: 256 },
            { title: "Bad RaceTrac PO", flag: 528 },
        ]
    const getReasons = row => {
        let retval = FlagMaps
            .filter(x => (row.errormask&x.flag)===x.flag)
            .map(x=>x.title)

        return retval.length === 0 ? ["Unknown"] : retval
    }
    const vals = [
        {a:'BillTo',b:'ord_billto'},
        {a:'Shipper',b:'ord_shipper'},
        {a:'Consignee',b:'ord_consignee'},
        {a:'Delivered',b:'ord_completiondate'},
        {a:'Driver',b:'ord_driver1'},
    ]
    const check1 = (r) => isMP(json,r[kpi.mpf])
    const check2 = (r) => hasOne(json,r[kpi.mpf])
    const checks = (r) => check1(r) ? check2(r) ? 'has-one-paperwork': 'missing-paperwork' : ''
</script>
<div class="row g-2 mb-3">
    {#each rows as row}
    <div class="col-md-4">
        <div class="card text-dark {checks(row)}">
            <div class="card-header bg-light text-dark d-flex justify-content-between">
                <span>Order:</span>
                <span>{row.ord_hdrnumber}</span>
            </div>
            <div class="card-body p-2">
                {#each vals as val}
                <div class="d-flex justify-content-between mx-2">
                    <span class="text-muted"><small>{val.a}:</small></span>
                    <span><small>{row[val.b]}</small></span>
                </div>
                {/each}
                <div class="alert alert-light border-info mt-3">
                    <p class="border-bottom text-center">Reasons for DNI:</p>
                    <ul>
                        {#each getReasons(row) as reason}
                        <li><small>{reason}</small></li>
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    </div>
    {/each}     
</div>
