function getMasterWithAggregates() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('masterAggregated');
  if (cached) return JSON.parse(cached);

  const master = getSheetData(SHEET_NAMES.MASTER);
  const salur = getSheetData(SHEET_NAMES.SALUR);
  const aggregates = new Map();

  for (const item of salur) {
    const idPm = item['ID PM'];
    if (!idPm) continue;
    if (!aggregates.has(idPm)) {
      aggregates.set(idPm, { programs: new Set(), total: 0 });
    }

    const aggregate = aggregates.get(idPm);
    if (item.PROGRAM) aggregate.programs.add(item.PROGRAM);
    if (item['JUMLAH PENERIMAAN']) {
      aggregate.total += Number(item['JUMLAH PENERIMAAN']);
    }
  }

  const result = master.map(item => ({
    ...item,
    'PENERIMAAN PROGRAM': aggregates.has(item['ID PM'])
      ? Array.from(aggregates.get(item['ID PM']).programs).join(', ')
      : '-',
    'TOTAL PENERIMAAN': aggregates.has(item['ID PM'])
      ? aggregates.get(item['ID PM']).total
      : 0
  }));

  try {
    // CacheService membatasi 100KB per nilai; gagal cache tidak boleh gagalkan request.
    cache.put('masterAggregated', JSON.stringify(result), 300);
  } catch (err) {
    console.warn('Cache master dilewati: ' + err.message);
  }
  return result;
}

function invalidateMasterCache() {
  CacheService.getScriptCache().remove('masterAggregated');
}