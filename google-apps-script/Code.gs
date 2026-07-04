// ============================================================
// El-Dawly Daily Reports — Google Apps Script Backend  V3
// ============================================================
// INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Delete any default code and paste this entire file
// 4. Click Deploy > New Deployment
//    - Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL and paste it into src/utils/api.js
//
// REQUIRED SHEET TABS & COLUMNS (create headers in Row 1):
//
// "Users"
//   username | password_hash | whatsapp_number | join_date | status | role | display_name | last_login
//
// "Progress_Reports"
//   id | username | date | report_text | hours_studied | created_at
//
// "Deadlines"
//   id | username | task_name | target_date | status | priority | created_at
//
// "WhatsApp_Sent"  (auto-created on first use)
//   id | date | target_username | admin_device | sent_at
//
// STATUS values: "pending" | "approved" | "suspended"
// ROLE values:   "admin"  | "user"
// ============================================================

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// ─── UTILITIES ─────────────────────────────────────────────

/**
 * Get a sheet by name. Throws if not found.
 */
function getSheet(name) {
  const sheet = SPREADSHEET.getSheetByName(name);
  if (!sheet) throw new Error("Sheet not found: " + name);
  return sheet;
}

/**
 * Get or create a sheet with the given headers.
 * Used for optional sheets like WhatsApp_Sent.
 */
function getOrCreateSheet(name, headers) {
  let sheet = SPREADSHEET.getSheetByName(name);
  if (!sheet) {
    sheet = SPREADSHEET.insertSheet(name);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
  }
  return sheet;
}

/**
 * Normalize any date value to "YYYY-MM-DD" string.
 * Handles Date objects, ISO strings, and existing YYYY-MM-DD strings.
 */
function formatDate(d) {
  if (!d) return "";
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  if (typeof d === "string") {
    // Already YYYY-MM-DD? Return the first 10 chars.
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0, 10);
    // Try to parse and re-format
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
  }
  return String(d);
}

/** Current timestamp as ISO string */
function nowISO() {
  return new Date().toISOString();
}

/** Today as YYYY-MM-DD in the script's timezone */
function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/**
 * Validate that all required fields exist in the payload.
 * Throws a descriptive error if any field is missing.
 */
function validateRequired(payload, fields) {
  if (!payload) throw new Error("Payload is empty");
  for (const f of fields) {
    if (payload[f] === undefined || payload[f] === null || payload[f] === "") {
      throw new Error("Missing required field: " + f);
    }
  }
}

/**
 * Determine a user's role from their data row.
 * Falls back to username check for backward compatibility
 * with sheets that don't yet have the role column populated.
 */
function getUserRole(userRow) {
  // Column 5 (index 5) = role
  const role = userRow[5];
  if (role === "admin" || role === "user") return role;
  // Backward compat: if role is empty, infer from username
  return userRow[0] === "admin" ? "admin" : "user";
}

/**
 * Check if a username has admin role by reading the Users sheet.
 */
function isUserAdmin(username) {
  const sheet = getSheet("Users");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return getUserRole(data[i]) === "admin";
    }
  }
  return false;
}

/**
 * Guard: throw if the given username is not an admin.
 */
function requireAdmin(username) {
  if (!username) throw new Error("Unauthorized: No username provided");
  if (!isUserAdmin(username)) {
    throw new Error("Unauthorized: Admin access required");
  }
}

// ─── STREAK COMPUTATION ───────────────────────────────────

/**
 * Compute current and best-ever streaks from an array of date strings.
 * @param {string[]} sortedDates  Sorted YYYY-MM-DD strings (ascending) where hours > 0
 * @param {string}   today        Today's date as YYYY-MM-DD
 * @returns {{ current: number, best: number }}
 */
function computeStreaks(sortedDates, today) {
  if (!sortedDates || sortedDates.length === 0) {
    return { current: 0, best: 0 };
  }

  // ── Best streak ever ──
  var bestStreak = 1;
  var runLength = 1;

  for (var i = 1; i < sortedDates.length; i++) {
    var prev = new Date(sortedDates[i - 1] + "T12:00:00");
    var curr = new Date(sortedDates[i] + "T12:00:00");
    var diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      runLength++;
      if (runLength > bestStreak) bestStreak = runLength;
    } else if (diffDays > 1) {
      runLength = 1;
    }
    // diffDays === 0 → duplicate date, skip
  }

  // ── Current streak ──
  var todayDate = new Date(today + "T12:00:00");
  var yesterday = new Date(todayDate.getTime() - 86400000);
  var yesterdayS = formatDate(yesterday);

  var dateSet = {};
  for (var j = 0; j < sortedDates.length; j++) {
    dateSet[sortedDates[j]] = true;
  }

  var currentStreak = 0;
  var checkDate;

  if (dateSet[today]) {
    checkDate = new Date(todayDate);
  } else if (dateSet[yesterdayS]) {
    checkDate = new Date(yesterday);
  } else {
    return { current: 0, best: bestStreak };
  }

  while (true) {
    var ds = formatDate(checkDate);
    if (dateSet[ds]) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return {
    current: currentStreak,
    best: Math.max(bestStreak, currentStreak)
  };
}

// ─── ROUTER ────────────────────────────────────────────────

function doPost(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.payload || {};
    var result;

    switch (action) {
      // ── Auth ──
      case "signup":              result = handleSignup(payload); break;
      case "login":               result = handleLogin(payload); break;

      // ── Reports ──
      case "submitReport":        result = handleSubmitReport(payload); break;
      case "getUserData":         result = handleGetUserData(payload); break;

      // ── Admin: Data & User Management ──
      case "getAdminData":        result = handleGetAdminData(payload); break;
      case "approveUser":         result = handleApproveUser(payload); break;
      case "suspendUser":         result = handleSuspendUser(payload); break;
      case "deleteUser":          result = handleDeleteUser(payload); break;
      case "resetPassword":       result = handleResetPassword(payload); break;

      // ── Deadlines ──
      case "addDeadline":         result = handleAddDeadline(payload); break;
      case "getDeadlines":        result = handleGetDeadlines(payload); break;
      case "updateDeadline":      result = handleUpdateDeadline(payload); break;

      // ── Leaderboard (PUBLIC — no auth) ──
      case "getLeaderboard":      result = handleGetLeaderboard(); break;

      // ── WhatsApp Tracking (Admin) ──
      case "markWhatsAppSent":    result = handleMarkWhatsAppSent(payload); break;
      case "unmarkWhatsAppSent":  result = handleUnmarkWhatsAppSent(payload); break;
      case "getWhatsAppSent":     result = handleGetWhatsAppSent(payload); break;

      default:
        throw new Error("Invalid action: " + action);
    }

    return response.setContent(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    return response.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
}

// ─── AUTH HANDLERS ─────────────────────────────────────────

function handleSignup(payload) {
  validateRequired(payload, ["username", "password_hash", "whatsapp_number"]);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();
  var username = String(payload.username).trim();

  if (username.length < 2) throw new Error("Username too short (min 2 characters)");
  if (username.length > 30) throw new Error("Username too long (max 30 characters)");

  // Case-insensitive duplicate check
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username.toLowerCase()) {
      throw new Error("Username already exists");
    }
  }

  // First user named "admin" gets auto-approved with admin role
  var isAdminUser = username.toLowerCase() === "admin";
  var initialStatus = isAdminUser ? "approved" : "pending";
  var initialRole = isAdminUser ? "admin" : "user";

  // Columns: username | password_hash | whatsapp_number | join_date | status | role | display_name | last_login
  sheet.appendRow([
    username,
    payload.password_hash,
    String(payload.whatsapp_number).trim(),
    todayStr(),
    initialStatus,
    initialRole,
    username,   // display_name defaults to username
    ""          // last_login
  ]);

  return "User created successfully";
}

function handleLogin(payload) {
  validateRequired(payload, ["username", "password_hash"]);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();
  var username = String(payload.username).trim();

  for (var i = 1; i < data.length; i++) {
    // Case-insensitive username match, exact password hash match
    if (
      String(data[i][0]).toLowerCase() === username.toLowerCase() &&
      data[i][1] === payload.password_hash
    ) {
      var status = data[i][4] || "pending";
      var role = getUserRole(data[i]);

      if (status === "pending" && role !== "admin") {
        throw new Error("ACCOUNT_PENDING");
      }
      if (status === "suspended" && role !== "admin") {
        throw new Error("ACCOUNT_SUSPENDED");
      }

      // Update last_login (column 8 = index 7)
      sheet.getRange(i + 1, 8).setValue(nowISO());

      return {
        username: data[i][0],
        whatsapp_number: data[i][2],
        join_date: data[i][3],
        isAdmin: role === "admin",
        displayName: data[i][6] || data[i][0]
      };
    }
  }

  throw new Error("Invalid username or password");
}

// ─── REPORT HANDLERS ──────────────────────────────────────

function handleSubmitReport(payload) {
  validateRequired(payload, ["username", "date"]);

  var sheet = getSheet("Progress_Reports");
  var id = Utilities.getUuid();

  // Columns: id | username | date | report_text | hours_studied | created_at
  sheet.appendRow([
    id,
    payload.username,
    payload.date,
    payload.report_text || "",
    Number(payload.hours_studied) || 0,
    nowISO()
  ]);

  return "Report added";
}

function handleGetUserData(payload) {
  validateRequired(payload, ["username"]);

  var sheet = getSheet("Progress_Reports");
  var reports = sheet.getDataRange().getValues();

  var userReports = [];
  for (var i = 1; i < reports.length; i++) {
    if (reports[i][1] === payload.username) {
      userReports.push({
        date: reports[i][2],
        text: reports[i][3],
        hours: reports[i][4]
      });
    }
  }

  return { reports: userReports };
}

// ─── ADMIN HANDLERS ───────────────────────────────────────

function handleGetAdminData(payload) {
  validateRequired(payload, ["adminUsername"]);
  requireAdmin(payload.adminUsername);

  var usersSheet = getSheet("Users");
  var reportSheet = getSheet("Progress_Reports");

  return {
    allUsers: usersSheet.getDataRange().getValues().slice(1),
    allReports: reportSheet.getDataRange().getValues().slice(1)
  };
}

function handleApproveUser(payload) {
  validateRequired(payload, ["adminUsername", "targetUsername"]);
  requireAdmin(payload.adminUsername);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.getRange(i + 1, 5).setValue("approved");
      return "User approved";
    }
  }
  throw new Error("User not found");
}

function handleSuspendUser(payload) {
  validateRequired(payload, ["adminUsername", "targetUsername"]);
  requireAdmin(payload.adminUsername);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.getRange(i + 1, 5).setValue("suspended");
      return "User suspended";
    }
  }
  throw new Error("User not found");
}

function handleDeleteUser(payload) {
  validateRequired(payload, ["adminUsername", "targetUsername"]);
  requireAdmin(payload.adminUsername);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.deleteRow(i + 1);
      return "User deleted";
    }
  }
  throw new Error("User not found");
}

function handleResetPassword(payload) {
  validateRequired(payload, ["adminUsername", "targetUsername", "newPasswordHash"]);
  requireAdmin(payload.adminUsername);

  var sheet = getSheet("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.getRange(i + 1, 2).setValue(payload.newPasswordHash);
      return "Password reset successfully";
    }
  }
  throw new Error("User not found");
}

// ─── DEADLINE HANDLERS ────────────────────────────────────

function handleAddDeadline(payload) {
  validateRequired(payload, ["username", "task_name", "target_date"]);

  var sheet = getSheet("Deadlines");
  var id = Utilities.getUuid();

  // Columns: id | username | task_name | target_date | status | priority | created_at
  sheet.appendRow([
    id,
    payload.username,
    payload.task_name,
    payload.target_date,
    "Pending",
    payload.priority || "medium",
    nowISO()
  ]);

  return "Deadline added";
}

function handleGetDeadlines(payload) {
  validateRequired(payload, ["username"]);

  var sheet = getSheet("Deadlines");
  var data = sheet.getDataRange().getValues();

  var userDeadlines = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === payload.username) {
      userDeadlines.push({
        id: data[i][0],
        task_name: data[i][2],
        target_date: data[i][3],
        status: data[i][4]
      });
    }
  }

  return { deadlines: userDeadlines };
}

function handleUpdateDeadline(payload) {
  validateRequired(payload, ["id", "username", "newStatus"]);

  var sheet = getSheet("Deadlines");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id && data[i][1] === payload.username) {
      sheet.getRange(i + 1, 5).setValue(payload.newStatus);
      return "Deadline updated";
    }
  }

  throw new Error("Deadline not found");
}

// ─── LEADERBOARD (PUBLIC — NO AUTH) ───────────────────────

function handleGetLeaderboard() {
  var usersSheet = getSheet("Users");
  var reportsSheet = getSheet("Progress_Reports");

  var users = usersSheet.getDataRange().getValues().slice(1);
  var reports = reportsSheet.getDataRange().getValues().slice(1);
  var today = todayStr();

  // Filter to approved, non-admin users only
  var eligibleUsers = [];
  for (var u = 0; u < users.length; u++) {
    var status = users[u][4] || "pending";
    var role = getUserRole(users[u]);
    if (status === "approved" && role !== "admin") {
      eligibleUsers.push(users[u]);
    }
  }

  var leaderboard = [];

  for (var e = 0; e < eligibleUsers.length; e++) {
    var userRow = eligibleUsers[e];
    var username = userRow[0];
    var displayName = userRow[6] || userRow[0];
    var joinDate = userRow[3];

    // Gather this user's reports
    var totalHours = 0;
    var validDates = [];

    for (var r = 0; r < reports.length; r++) {
      if (reports[r][1] === username) {
        var hours = Number(reports[r][4]) || 0;
        totalHours += hours;
        if (hours > 0) {
          var d = formatDate(reports[r][2]);
          if (d) validDates.push(d);
        }
      }
    }

    // Deduplicate and sort dates
    var uniqueObj = {};
    for (var v = 0; v < validDates.length; v++) {
      uniqueObj[validDates[v]] = true;
    }
    var uniqueDates = Object.keys(uniqueObj).sort();

    // Compute streaks
    var streaks = computeStreaks(uniqueDates, today);

    leaderboard.push({
      username: username,
      displayName: displayName,
      joinDate: formatDate(joinDate),
      totalHours: Math.round(totalHours * 10) / 10,
      totalReports: uniqueDates.length,
      currentStreak: streaks.current,
      bestStreak: streaks.best
    });
  }

  return { leaderboard: leaderboard };
}

// ─── WHATSAPP TRACKING (ADMIN) ────────────────────────────

function handleMarkWhatsAppSent(payload) {
  validateRequired(payload, ["adminUsername", "date", "targetUsername", "adminDevice"]);
  requireAdmin(payload.adminUsername);

  var sheet = getOrCreateSheet("WhatsApp_Sent", [
    "id", "date", "target_username", "admin_device", "sent_at"
  ]);
  var data = sheet.getDataRange().getValues();

  // Check if already marked by this device
  for (var i = 1; i < data.length; i++) {
    if (
      formatDate(data[i][1]) === payload.date &&
      data[i][2] === payload.targetUsername &&
      data[i][3] === payload.adminDevice
    ) {
      return "Already marked";
    }
  }

  // Columns: id | date | target_username | admin_device | sent_at
  sheet.appendRow([
    Utilities.getUuid(),
    payload.date,
    payload.targetUsername,
    payload.adminDevice,
    nowISO()
  ]);

  return "Marked as sent";
}

function handleUnmarkWhatsAppSent(payload) {
  validateRequired(payload, ["adminUsername", "date", "targetUsername", "adminDevice"]);
  requireAdmin(payload.adminUsername);

  var sheet = getOrCreateSheet("WhatsApp_Sent", [
    "id", "date", "target_username", "admin_device", "sent_at"
  ]);
  var data = sheet.getDataRange().getValues();

  // Search from bottom to top to avoid row-shift issues
  for (var i = data.length - 1; i >= 1; i--) {
    if (
      formatDate(data[i][1]) === payload.date &&
      data[i][2] === payload.targetUsername &&
      data[i][3] === payload.adminDevice
    ) {
      sheet.deleteRow(i + 1);
      return "Unmarked";
    }
  }

  return "Not found";
}

function handleGetWhatsAppSent(payload) {
  validateRequired(payload, ["adminUsername", "date"]);
  requireAdmin(payload.adminUsername);

  var sheet = getOrCreateSheet("WhatsApp_Sent", [
    "id", "date", "target_username", "admin_device", "sent_at"
  ]);
  var data = sheet.getDataRange().getValues();

  var records = [];
  for (var i = 1; i < data.length; i++) {
    if (formatDate(data[i][1]) === payload.date) {
      records.push({
        targetUsername: data[i][2],
        adminDevice: data[i][3],
        sentAt: data[i][4]
      });
    }
  }

  return { records: records };
}
