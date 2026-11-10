// o = object to serialize to csv
// h = array of strings to use for header values if not the prop names
// n = name of the file, default to data, always appends csv
export const downloadcsv = (o, h, n = 'data') => {
    downloadFile(toCSV(o, h), n + '.csv', 'text/csv');
}
// quotes inside a cell are doubled. a text cell starting with = + - @ tab or CR gets a leading '
// so a spreadsheet opening the file reads it as text, not a formula. that's part of the owasp
// csv injection list: a leading LF and the fullwidth variants aren't covered (#32). numbers
// pass through, negatives included.
const cell = v => {
    let s = v == null ? '' : String(v)
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = `'${s}`
    return `"${s.replaceAll('"', '""')}"`
}
export const toCSV = (o, h) => {
    const row = r => r.map(cell).join(',')
    return [row(h ? h : Object.keys(o[0])), ...o.map(x => row(Object.values(x)))].join('\n')
}
const downloadFile = (fileContents, fileName, fileType) => {

    var blob = new Blob([fileContents], { type: fileType });

    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, fileName);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

}