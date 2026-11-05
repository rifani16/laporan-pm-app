const SHEET_NAMES = {
  MASTER: 'MASTER_PM',
  SALUR: 'SALUR',
  REF: 'REF',
  USERS: 'Users'
};

// Isi Script Properties: API_KEY (Project Settings > Script Properties).
// Nilai yang sama harus diset sebagai env GAS_API_KEY di Vercel.
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('API_KEY') || '';
}
