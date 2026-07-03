// ============================================================
// API Gateway — Unified fetch wrapper to Google Apps Script
// ============================================================
// Replace this URL with your deployed Google Apps Script Web App URL.
// Deploy > New Deployment > Web App > Execute as Me > Anyone
const API_URL = "https://script.google.com/macros/s/AKfycbx7hkZ_CNYrgZ1Gkhyy-JvhTzV1HodLBIoAmzewDwdT2mzVAJAx97jtrGAxHA94y6_gOw/exec";

/**
 * Send an action + payload to the Google Apps Script backend.
 * Uses "text/plain" content-type to avoid CORS preflight requests.
 *
 * @param {string} action  - The handler name (signup, login, submitReport, getUserData, getAdminData)
 * @param {object} payload - Action-specific data
 * @returns {Promise<any>}  Resolved data from the backend
 */
export const apiRequest = async (action, payload) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Unknown server error");
    }

    return result.data;
  } catch (error) {
    console.error(`[API] ${action} failed:`, error);
    throw error;
  }
};
