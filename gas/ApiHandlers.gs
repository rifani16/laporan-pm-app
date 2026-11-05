const USER_ACTIONS = ['TAMBAH_AKUN', 'EDIT_AKUN', 'STATUS_AKUN', 'RESET_PASSWORD_AKUN'];
const SUPER_ADMIN_ONLY_ACTIONS = [
  'HAPUS_MASTER', 'HAPUS_PM_PROGRAM',
  'TAMBAH_PROGRAM', 'EDIT_PROGRAM', 'HAPUS_PROGRAM',
  ...USER_ACTIONS
];
const DAERAH_SCOPED_ACTIONS = ['TAMBAH_MASTER', 'EDIT_MASTER', 'TAMBAH_SALUR', 'EDIT_SALUR'];

function isSuperAdmin(session) {
  return session.role === 'super_admin';
}

function filterByDaerah(rows, session) {
  if (isSuperAdmin(session)) return rows;
  const daerah = String(session.daerah || '').trim();
  if (!daerah) return [];
  return rows.filter(row => String(row['DAERAH'] || '').trim() === daerah);
}

function assertRowInDaerah(sheetName, idHeader, id, session) {
  const row = getSheetData(sheetName).find(
    item => String(item[idHeader]).trim() === String(id).trim()
  );
  if (!row) throw new Error(idHeader + ' tidak ditemukan');
  if (String(row['DAERAH'] || '').trim() !== String(session.daerah || '').trim()) {
    throw new Error('Akses ditolak untuk data daerah lain');
  }
}

function handleGetRequest(e) {
  try {
    const params = (e && e.parameter) || {};
    if (!checkApiKey(params.api_key)) return errorResponse('Unauthorized', 401);

    const session = getActiveSession(params.token);
    if (!session) return errorResponse('Sesi berakhir, silakan login ulang', 401);

    return dataResponse({
      master: filterByDaerah(getMasterWithAggregates(), session),
      salur: filterByDaerah(getSheetData(SHEET_NAMES.SALUR), session),
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

    if (SUPER_ADMIN_ONLY_ACTIONS.includes(action) && !isSuperAdmin(session)) {
      return errorResponse('Akses ditolak', 403);
    }

    if (action === 'CHANGE_PASSWORD' || action === 'LOGOUT') {
      sanitizedData.username = session.username;
      sanitizedData.session_token = body.session_token;
    }
    if (USER_ACTIONS.includes(action)) sanitizedData.actor = session.username;

    if (!isSuperAdmin(session) && DAERAH_SCOPED_ACTIONS.includes(action)) {
      if (!session.daerah) return errorResponse('Akun belum memiliki daerah', 403);
      if (action === 'EDIT_MASTER') {
        assertRowInDaerah(SHEET_NAMES.MASTER, 'ID PM', sanitizedData['ID PM'], session);
      }
      if (action === 'EDIT_SALUR') {
        assertRowInDaerah(SHEET_NAMES.SALUR, 'ID SALUR', sanitizedData['ID SALUR'], session);
      }
      if (action === 'TAMBAH_SALUR') {
        assertRowInDaerah(SHEET_NAMES.MASTER, 'ID PM', sanitizedData['ID PM'], session);
      }
      sanitizedData['DAERAH'] = session.daerah;
    }

    const featureHandlers = [
      handleAuthAction,
      handleMasterAction,
      handlePenyaluranAction,
      handleProgramAction,
      handleUserAction
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
