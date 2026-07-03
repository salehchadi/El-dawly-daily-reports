// ============================================================
// El-Dawly Daily Reports — Google Apps Script Backend (V2)
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
// REQUIRED SHEET TABS & COLUMNS:
// - "Users"            → username | password_hash | whatsapp_number | join_date | status
// - "Progress_Reports" → id | username | date | report_text | hours_studied
// - "Deadlines"        → id | username | task_name | target_date | status
// ============================================================

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result = {};

    if (action === "signup") {
      result = handleSignup(data.payload);
    } else if (action === "login") {
      result = handleLogin(data.payload);
    } else if (action === "submitReport") {
      result = handleSubmitReport(data.payload);
    } else if (action === "getUserData") {
      result = handleGetUserData(data.payload);
    } else if (action === "getAdminData") {
      result = handleGetAdminData(data.payload);
    } else if (action === "approveUser") {
      result = handleApproveUser(data.payload);
    } else if (action === "suspendUser") {
      result = handleSuspendUser(data.payload);
    } else if (action === "deleteUser") {
      result = handleDeleteUser(data.payload);
    } else if (action === "resetPassword") {
      result = handleResetPassword(data.payload);
    } else if (action === "addDeadline") {
      result = handleAddDeadline(data.payload);
    } else if (action === "getDeadlines") {
      result = handleGetDeadlines(data.payload);
    } else if (action === "updateDeadline") {
      result = handleUpdateDeadline(data.payload);
    } else {
      throw new Error("Invalid action: " + action);
    }

    return response.setContent(
      JSON.stringify({ success: true, data: result })
    );
  } catch (error) {
    return response.setContent(
      JSON.stringify({ success: false, error: error.toString() })
    );
  }
}

// ─── HANDLERS ──────────────────────────────────────────────

function handleSignup(payload) {
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  // Check if username already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.username) {
      throw new Error("Username already exists");
    }
  }

  const initialStatus = payload.username === "admin" ? "approved" : "pending";

  sheet.appendRow([
    payload.username,
    payload.password_hash,
    payload.whatsapp_number,
    new Date().toISOString().split("T")[0],
    initialStatus
  ]);

  return "User created successfully";
}

function handleLogin(payload) {
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (
      data[i][0] === payload.username &&
      data[i][1] === payload.password_hash
    ) {
      const status = data[i][4] || "pending";
      
      if (status === "pending" && data[i][0] !== "admin") {
        throw new Error("ACCOUNT_PENDING");
      }
      
      if (status === "suspended" && data[i][0] !== "admin") {
        throw new Error("ACCOUNT_SUSPENDED");
      }

      return {
        username: data[i][0],
        whatsapp_number: data[i][2],
        join_date: data[i][3],
        isAdmin: data[i][0] === "admin",
      };
    }
  }

  throw new Error("Invalid username or password");
}

function handleSubmitReport(payload) {
  const sheet = SPREADSHEET.getSheetByName("Progress_Reports");
  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    payload.username,
    payload.date,
    payload.report_text,
    payload.hours_studied,
  ]);

  return "Report added";
}

function handleGetUserData(payload) {
  const reportSheet = SPREADSHEET.getSheetByName("Progress_Reports");
  const reports = reportSheet.getDataRange().getValues();

  const userReports = reports
    .filter((row, index) => index !== 0 && row[1] === payload.username)
    .map((row) => ({
      date: row[2],
      text: row[3],
      hours: row[4],
    }));

  return { reports: userReports };
}

function handleGetAdminData(payload) {
  if (payload.adminUsername !== "admin") {
    throw new Error("Unauthorized");
  }

  const reportSheet = SPREADSHEET.getSheetByName("Progress_Reports");
  const usersSheet = SPREADSHEET.getSheetByName("Users");

  return {
    allUsers: usersSheet.getDataRange().getValues().slice(1),
    allReports: reportSheet.getDataRange().getValues().slice(1),
  };
}

function handleApproveUser(payload) {
  if (payload.adminUsername !== "admin") throw new Error("Unauthorized");
  
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.getRange(i + 1, 5).setValue("approved");
      return "User approved";
    }
  }
  throw new Error("User not found");
}

function handleSuspendUser(payload) {
  if (payload.adminUsername !== "admin") throw new Error("Unauthorized");
  
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.getRange(i + 1, 5).setValue("suspended");
      return "User suspended";
    }
  }
  throw new Error("User not found");
}

function handleDeleteUser(payload) {
  if (payload.adminUsername !== "admin") throw new Error("Unauthorized");
  
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      sheet.deleteRow(i + 1);
      return "User deleted";
    }
  }
  throw new Error("User not found");
}

function handleResetPassword(payload) {
  if (payload.adminUsername !== "admin") throw new Error("Unauthorized");
  
  const sheet = SPREADSHEET.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.targetUsername) {
      // Row is i + 1, Column 2 is password_hash
      sheet.getRange(i + 1, 2).setValue(payload.newPasswordHash);
      return "Password reset successfully";
    }
  }
  throw new Error("User not found");
}

function handleAddDeadline(payload) {
  const sheet = SPREADSHEET.getSheetByName("Deadlines");
  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    payload.username,
    payload.task_name,
    payload.target_date,
    "Pending"
  ]);

  return "Deadline added";
}

function handleGetDeadlines(payload) {
  const sheet = SPREADSHEET.getSheetByName("Deadlines");
  const data = sheet.getDataRange().getValues();
  
  const userDeadlines = data
    .filter((row, index) => index !== 0 && row[1] === payload.username)
    .map((row) => ({
      id: row[0],
      task_name: row[2],
      target_date: row[3],
      status: row[4]
    }));
    
  return { deadlines: userDeadlines };
}

function handleUpdateDeadline(payload) {
  const sheet = SPREADSHEET.getSheetByName("Deadlines");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id && data[i][1] === payload.username) {
      sheet.getRange(i + 1, 5).setValue(payload.newStatus);
      return "Deadline updated";
    }
  }
  
  throw new Error("Deadline not found");
}
