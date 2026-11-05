function dataResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(message, extra = {}) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message, ...extra }))
    .setMimeType(ContentService.MimeType.JSON);
}

// GAS TextOutput tidak bisa set status HTTP; kode dikirim di body.
function errorResponse(message, code = 400) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message, code }))
    .setMimeType(ContentService.MimeType.JSON);
}
