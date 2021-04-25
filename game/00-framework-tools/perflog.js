// Time in milliseconds, float with microsecond precision if available.
const millitime = (typeof performance === 'object' && typeof performance.now === 'function') ? 
	function() { return performance.now() } : function() { return new Date().getTime() };
DOL.Perflog.millitime = millitime;

/**
 * Widget performance records for one passage.
 * Key = widget name, value = {
 *  name: widget name,
 * 	n: number of widget calls,
 *  total: Sum of execution times including internal widget calls, milliseconds
 *  own: Sum of execution times excluding internal widget calls, milliseconds
 * }.
 */
var wpRec = {}; // Widget performance records
/**
 * Global widget performance records
 */
DOL.Perflog.globalRec = {};
DOL.Perflog.lastRec = {};
/**
 * Performance stack entry = { t0: widget start time, i: internal widget duration }
 */
const wpStack = []; // Widget performance stack
DOL.Perflog.nPassages = 0;
$(document).on(':passageend', function() {
    DOL.Perflog.nPassages++;
    for (var name in wpRec) {
        var rec = wpRec[name];
        var grec = DOL.Perflog.globalRec[name];
        if (!grec) {
            DOL.Perflog.globalRec[name] = rec;
        } else {
            grec.n += rec.n;
            grec.total += rec.total;
            grec.own == rec.own;
        }
    }
    DOL.Perflog.lastRec = wpRec;
    wpRec = {};
});
DOL.Perflog.logWidgetStart = function(widgetName) {
    wpStack.push({
        name: widgetName,
        t0: millitime(), 
        i: 0
    });
}
DOL.Perflog.logWidgetEnd = function(widgetName) {
    const perflog = wpStack[wpStack.length - 1];
    if (!perflog || perflog.name != widgetName) {
        Errors.report("Inconsistent widget performance stack", wpStack);
        return;
    }
    const prevPerflog = wpStack[wpStack.length - 2];
    perflog.t1 = millitime();
    const dt = perflog.t1-perflog.t0;
    if (prevPerflog) {
        prevPerflog.i += dt;
    }
    var perfrec = wpRec[widgetName];
    if (!perfrec) perfrec = wpRec[widgetName] = { 
        name:widgetName, 
        n:0, 
        total:0, 
        own:0 
    };
    perfrec.n++;
    perfrec.total += dt;
    perfrec.own += dt - perflog.i;
    wpStack.pop();
}
/**
 * Return performance report. Can be viewed by DevTools table() function.
 * 
 * Returns array of objects:
 *  `name`: Widget name
 *  `n`: Times widget called
 *  `total`: Sum of widget execution time, including inner widgets, ms
 *  `own`: Sum of widget execution time, excluding inner widgets, ms
 *  `totalp1`: Average widget execution time, including inner widgets, ms
 *  `ownp1`: Average widget execution time, excluding inner widgets, ms
 *  `npp`: Average time widget called per passage
 *  `totalpp`: Average total time per passage
 *  `ownpp`: Average own time per passage
 * 
 * @param {object} options 
 * @param {string} [options.sort='own'] Property to sort entries by
 * @param {number} [options.limit=20] Max number of entries to report, 0 to no limit
 * @param {boolean} [options.global=true] Report widgets from all recorded history or from last passage only.
 */
DOL.Perflog.report = function (options) {
    options = Object.assign({
        sort: 'own',
        limit: 20,
        global: true
    }, options);
    var entries;
    if (options.global) {
        const np = DOL.Perflog.nPassages;
        // Add 'per passage' metrics
        entries = Object.values(DOL.Perflog.globalRec).map(e=>Object.assign({
            npp: e.n/np,
            totalpp: e.total/np,
            ownpp: e.own/np,
            totalp1: e.total/e.n,
            ownp1: e.own/e.n
        }, e));
    } else {
        entries = Object.values(DOL.Perflog.lastRec).map(e=>Object.assign({
            totalp1: e.total/e.n,
            ownp1: e.own/e.n
        }, e));
    }
    var comparator;
    const sort = options.sort;
    switch (sort) {
        case 'own':
        case 'total':
        case 'n':
        case 'npp':
        case 'ownpp':
        case 'totalpp':
        case 'totalp1':
        case 'ownp1':
            comparator = (a,b)=>b[sort] - a[sort];
            break;
        case 'name':
        default:
            comparator = (a,b)=> a.name < b.name ? -1 : a.name > b.name ? +1 : 0;
    }
    entries.sort(comparator);
    if (options.limit > 0 && entries.length > options.limit) entries.splice(options.limit);
    return entries;
}