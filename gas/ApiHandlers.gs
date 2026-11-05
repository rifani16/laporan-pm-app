// Hanya super admin yang mengubah data. Admin wilayah dan admin daerah hanya memantau;
// aksi yang boleh mereka jalankan didaftar di sini, selebihnya ditolak.
const MONITOR_ALLOWED_ACTIONS = ['LOGOUT', 'CHANGE_PASSWORD'];
// Aksi yang mencatat username pelaku (jejak input atau perlindungan akun sendiri).
const ACTOR_ACTIONS = ['TAMBAH_AKUN', 'EDIT_AKUN', 'STATUS_AKUN', 'RESET_PASSWORD_AKUN', 'TAMBAH_SALUR', 'EDIT_SALUR'];

function isSuperAdmin(session) {
  return session.role === 'super_admin';
}

function canRunAction(session, action) {
  return isSuperAdmin(session) || MONITOR_ALLOWED_ACTIONS.includes(action);
}

// Admin wilayah memantau seluruh daerah (provinsi); admin daerah hanya daerahnya.
function seesAllDaerah(session) {
  return isSuperAdmin(session) || session.role === 'admin_wilayah';
}

function filterByDaerah(rows, session) {
  if (seesAllDaerah(session)) return rows;
  const daerah = String(session.daerah || '').trim();
  if (!daerah) return [];
  return rows.filter(row => String(row['DAERAH'] || '').trim() === daerah);
}

function handleGetRequest(e) {
  try {
    const params = (e && e.parameter) || {};
    if (!checkApiKey(params.api_key)) return errorResponse('Unauthorized', 401);

    const session = getActiveSession(params.token);
    if (!session) return errorResponse('Sesi berakhir, silakan login ulang', 401);

    const salur = getSheetData(SHEET_NAMES.SALUR);
    return dataResponse({
      master: filterByDaerah(getMasterWithAggregates(), session),
      salur: filterByDaerah(salur, session),
      kegiatan: listKegiatan(salur),
      ref: getRefData(),
      users: isSuperAdmin(session) ? listUsers() : []
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

function handlePostRequest(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!checkApiKey(body.api_key)) return errorResponse('Unauthorized', 401);

    const { action, data } = body;
    if (!action || !data || typeof data !== 'object') {
      throw new Error('Aksi atau data tidak lengkap');
    }

    const sanitizedData = sanitizeObject(data);

    if (action === 'LOGIN') return handleAuthAction(action, sanitizedData);

    const session = getActiveSession(body.session_token);
    if (!session) return errorResponse('Sesi berakhir, silakan login ulang', 401);

    if (!canRunAction(session, action)) {
      return errorResponse('Akses ditolak: akun ini hanya untuk memantau data', 403);
    }

    if (action === 'CHANGE_PASSWORD' || action === 'LOGOUT') {
      sanitizedData.username = session.username;
      sanitizedData.session_token = body.session_token;
    }
    if (ACTOR_ACTIONS.includes(action)) sanitizedData.actor = session.username;

    const featureHandlers = [
      handleAuthAction,
      handleMasterAction,
      handlePenyaluranAction,
      handleProgramAction,
      handleUserAction,
      handleKegiatanAction
    ];

    for (const handler of featureHandlers) {
      const response = handler(action, sanitizedData);
      if (response) return response;
    }

    throw new Error('Aksi tidak dikenal');
  } catch (err) {
    return errorResponse(err.message);
  }
}
