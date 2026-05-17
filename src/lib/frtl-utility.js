export const addDays = (date, days) => {
    if (days === 0) return date;
    const copy = new Date(Number(date))
    copy.setDate(date.getDate() + days)
    return copy
}
export const addMonths = (date, months) => {
    if (months === 0) return date;
    const copy = new Date(Number(date))
    copy.setMonth(date.getMonth() + months)
    return copy
}
// Date.prototype.addDays = function (days) {
//     var date = new Date(this.valueOf());
//     date.setDate(date.getDate() + days);
//     return date;
//   }
function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
      dateArray.push(new Date(currentDate));
      currentDate = currentDate.addDays(1);
    }
    return dateArray;
  }
export const sumBy = (data, rkey, rval) => Array
    .from(data
        .map(x => { return { key: x[rkey], val: parseFloat(x[rval]) } })
        .reduce((m, { key, val }) => m.set(key, (m.get(key) || 0) + val), new Map),
        ([key, val]) => ({ key, val }))
    .sort((a, b) => { return b.val - a.val })

export const countBy = (data, rkey, rval) => Array
    .from(data
        .map(x => { return { key: x[rkey], val: parseFloat(x[rval]) } })
        .reduce((m, { key }) => m.set(key, (m.get(key) || 0) + 1), new Map),
        ([key, val]) => ({ key, val }))
    .sort((a, b) => { return b.val - a.val })
/**
 * for d, group on k, sum by values in ...v
 * @param {dataset to process} d 
 * @param {key to group by} k 
 * @param  {one or more value fields to use for each grouping} vv 
 */
export const sumByMany = (d, k, ...vv) => d
    //get unique keys as object
    .map(x => x[k]).filter((x, i, a) => a.indexOf(x) == i).map(x => ({ [k]: x }))
    //add sum values as new properties to return value
    .map(x => {
        vv.forEach(v => x[v] = d
            .filter(f => f[k] === x[k])
            .map(f => f[v])
            .reduce((a, b) => Number(a) + Number(b))
        )
        return x
    })
export const getUniqueValues = vals => [...new Set(vals)]
export const filterUnique = (x, i, a) => a.indexOf(x) == i
export const cumulativeSum = (sum => value => sum += value)(0);
export const convertToDate = tds => new Date(parseInt(tds.substr(6)))
const toUTC = x => {
    const d = new Date(x);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
};
export const date_diff_indays = (d1, d2) => Math
    .floor((toUTC(d2) - toUTC(d1)) / (1000 * 60 * 60 * 24));

export const number_format = (number, decimals, dec_point = '.', thousands_sep = ',') => {
    // *     example: number_format(1234.56, 2, ',', ' ');
    // *     return: '1 234,56'
    number = (number + '').replace(',', '').replace(' ', '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, thousands_sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec_point);
}
// EbeV1.MissingPaperworkV1 (~3700 rows) was being scanned via .some() on
// every isMP / hasOne / hasMultiplePages call — and those fire for every
// row of every showMPS KPI on Billing mount. Pre-index the rows into Sets
// once per data store ref so each lookup is O(1) instead of O(3700).
let _mpJsonRef = null
let _mpAll = null
let _mpHasOne = null
let _mpHasMultiple = null

const buildMpSets = (json) => {
    if (json === _mpJsonRef) return
    const rows = json?.EbeV1?.MissingPaperworkV1 ?? []
    _mpAll = new Set(rows.map(x => x.ord_hdrnumber.toString()))
    _mpHasOne = new Set(rows.filter(x => x.hasOne).map(x => x.ord_hdrnumber.toString()))
    _mpHasMultiple = new Set(rows.filter(x => x.hasMultiplePages).map(x => x.ord_hdrnumber.toString()))
    _mpJsonRef = json
}

const normalize = (v) => v.toString().replace(/\D/g, '')

export const isMP = (json, valToCheck) => {
    if (valToCheck === undefined) return false
    buildMpSets(json)
    return _mpAll.has(normalize(valToCheck))
}

export const hasOne = (json, valToCheck) => {
    if (valToCheck === undefined) return false
    buildMpSets(json)
    return _mpHasOne.has(normalize(valToCheck))
}

export const hasMultiplePages = (json, valToCheck) => {
    if (valToCheck === undefined) return false
    buildMpSets(json)
    return _mpHasMultiple.has(normalize(valToCheck))
}
        
//some utility/helper functions.
//const groupBy = (x, key) => x.reduce((rv, x)=> { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, []);
//var countBy = (x, key) => x.map(x=>x[key]).reduce((a,b) => (a[b] = a[b] + 1 || 1) && a, {})

//source https://www.golangprograms.com/javascript-sort-multi-dimensional-array-on-specific-columns.html
/**
 * Sorts an array of objects by column/property.
 * @param {Array} array - The array of objects.
 * @param {object} sortObject - The object that contains the sort order keys with directions (asc/desc). e.g. { age: 'desc', name: 'asc' }
 * @returns {Array} The sorted array.
 */
 export const multiSort = (array, sortObject = {}) => {
    const sortKeys = Object.keys(sortObject);

    // Return array if no sort object is supplied.
    if (!sortKeys.length) {
        return array;
    }

    // Change the values of the sortObject keys to -1, 0, or 1.
    for (let key in sortObject) {
        sortObject[key] = sortObject[key] === 'desc' || sortObject[key] === -1 ? -1 : (sortObject[key] === 'skip' || sortObject[key] === 0 ? 0 : 1);
    }

    const keySort = (a, b, direction) => {
        direction = direction !== null ? direction : 1;

        if (a === b) { // If the values are the same, do not switch positions.
            return 0;
        }

        // If b > a, multiply by -1 to get the reverse direction.
        return a > b ? direction : -1 * direction;
    };

    return array.sort((a, b) => {
        let sorted = 0;
        let index = 0;

        // Loop until sorted (-1 or 1) or until the sort keys have been processed.
        while (sorted === 0 && index < sortKeys.length) {
            const key = sortKeys[index];

            if (key) {
                const direction = sortObject[key];

                sorted = keySort(a[key], b[key], direction);
                index++;
            }
        }

        return sorted;
    });
}