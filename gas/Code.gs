/**
 * Entry point Web App.
 * Implementasi request berada di ApiHandlers.gs.
 */
function doGet(e) {
  return handleGetRequest(e);
}

function doPost(e) {
  return handlePostRequest(e);
}
