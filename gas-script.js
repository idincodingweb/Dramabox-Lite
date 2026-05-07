function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "postData is undefined - check GAS deployment settings"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.postData) {
      try {
        data = JSON.parse(String(e.postData));
      } catch (parseErr) {
        data = e.postData;
      }
    } else {
      throw new Error("No postData received");
    }

    var action = data.action;

    if (action === "syncUser") {
      return syncUser(data.user);
    } else if (action === "syncActivity") {
      return syncActivity(data.activity);
    } else if (action === "uploadAvatar") {
      return uploadAvatar(data.file);
    } else {
      throw new Error("Unknown action type: " + action);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncUser(userData) {
  var spreadsheetId = "1HQARVrM9sI4gsSq8pQfXWdZOB4YMUNEjaFGacqdwzk4"; // MASUKKAN ID SPREADSHEET
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Users");
  if (!sheet) {
    sheet = SpreadsheetApp.openById(spreadsheetId).insertSheet("Users");
    sheet.appendRow(["UID", "Email", "DisplayName", "PhotoURL", "LastUpdated"]);
  }

  var data = sheet.getDataRange().getValues();
  var foundIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userData.uid) {
      foundIndex = i + 1;
      break;
    }
  }

  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 2, 1, 4).setValues([[
      userData.email,
      userData.displayName,
      userData.photoURL,
      new Date()
    ]]);
  } else {
    sheet.appendRow([
      userData.uid,
      userData.email,
      userData.displayName,
      userData.photoURL,
      new Date()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "User synced" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function syncActivity(activityData) {
  var spreadsheetId = "1HQARVrM9sI4gsSq8pQfXWdZOB4YMUNEjaFGacqdwzk4"; // MASUKKAN ID SPREADSHEET
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Activity");
  if (!sheet) {
    sheet = SpreadsheetApp.openById(spreadsheetId).insertSheet("Activity");
    sheet.appendRow(["UID", "Action", "Item", "Timestamp"]);
  }

  sheet.appendRow([
    activityData.uid,
    activityData.action,
    activityData.item,
    new Date()
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Activity logged" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function uploadAvatar(fileData) {
  try {
    if (!fileData || !fileData.base64) {
      throw new Error("base64 missing");
    }

    var folderId = "1K93_8nY90Sx340putzslyjlqx62P5VNC"; // MASUKKAN ID FOLDER DRIVE
    var folder = DriveApp.getFolderById(folderId);

    var contentType = fileData.mimeType || "image/png";
    var byteCharacters = Utilities.base64Decode(fileData.base64);
    var blob = Utilities.newBlob(byteCharacters, contentType, fileData.filename || "avatar.png");

    var file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      url: directUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
