// popup.js

let popupTabId = null;
let clientDict = {};  // will hold your client data lookup

chrome.tabs.getCurrent(tab => {
  popupTabId = tab.id;
});

// === Main data upload ===
document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
document.getElementById("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  if (file.name.match(/\.(csv)$/i)) {
    Papa.parse(file, {
      complete: ({ data: rows }) => buildTable(rows),
      skipEmptyLines: true
    });
  } else if (file.name.match(/\.(xlsx)$/i)) {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      // defval: "" pads out every blank so rows align
      const rows = XLSX.utils.sheet_to_json(
        workbook.Sheets[firstSheet],
        { header: 1, defval: "" }
      );
      buildTable(rows);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Unsupported file type. Please upload a .csv or .xlsx file.");
  }
});

// === Client data upload & parsing ===
document.getElementById("uploadClientBtn").addEventListener("click", () => {
  document.getElementById("clientFileInput").click();
});
document.getElementById("clientFileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.name.match(/\.(csv)$/i)) {
    Papa.parse(file, {
      complete: ({ data: rows }) => buildClientDict(rows),
      skipEmptyLines: true
    });
  } else if (file.name.match(/\.(xlsx)$/i)) {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(
        workbook.Sheets[firstSheet],
        { header: 1, defval: "" }
      );
      buildClientDict(rows);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Unsupported file type. Please upload a .csv or .xlsx file.");
  }
});

function buildClientDict(rows) {
  // Assume first row is header, and we key by the first column header
  const headers = rows[0].map(h => h.toString().trim());
  const keyField = headers[0];

  clientDict = {};  
  rows.slice(1).forEach(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i] ?? "");
    clientDict[obj[keyField]] = obj;
  });

  if(!clientDict){
    alert("please upload a client data file")
  }

  console.log("Loaded client data. Key field:", keyField, clientDict);
  alert("Client data loaded for key: " + keyField);
}

function buildTable(rows) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  // figure out which columns have real data
  const validCols = rows[0].map((_, ci) =>
    rows.slice(1).some(r => r[ci] && r[ci].toString().trim() !== "")
  );
  const cleanedRows = rows.map(r => r.filter((_, ci) => validCols[ci]));

  const table = document.createElement("table");
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  // ID column
  const idTh = document.createElement("th");
  idTh.textContent = "ID";
  headerRow.appendChild(idTh);

  // data headers
  cleanedRows[0].forEach(hdr => {
    const th = document.createElement("th");
    th.textContent = hdr;
    headerRow.appendChild(th);
  });

  // actions column
  const actionTh = document.createElement("th");
  actionTh.textContent = "Actions";
  headerRow.appendChild(actionTh);

  const tbody = table.createTBody();
  cleanedRows.slice(1).forEach((row, ri) => {
    const tr = tbody.insertRow();
    const uniqueId = window.crypto?.randomUUID?.() || `row-${ri + 1}`;

    // ID cell
    const idCell = tr.insertCell();
    idCell.textContent = uniqueId;

    // data cells
    row.forEach(cell => {
      const td = tr.insertCell();
      td.textContent = cell ?? "";
    });

    // action button
    const actionTd = tr.insertCell();
    const btn = document.createElement("button");
    btn.textContent = "Apply";
    btn.style.cssText = `
      padding: 6px 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    btn.addEventListener("click", () => {
      const rowDict = { popupTabId, uniqueId };
      cleanedRows[0].forEach((hdr, i) => {
        rowDict[hdr.trim()] = row[i]?.toString().trim() || "";
      });
      rowDict["client info"] = clientDict[rowDict['Company Name']];
      console.log(rowDict)
      const targetUrl = "https://my.uscis.gov/accounts/paralegal/file-form";
      chrome.tabs.create({ url: targetUrl, active: true }, newTab => {
        let sent = false, attempts = 0, retryTimer = null;
        function sendMessage() {
          if (sent || attempts >= 5) {
            if (!sent) console.error("Giving up after 5 attempts.");
            return;
          }
          attempts++;
          chrome.tabs.sendMessage(newTab.id, { type: "FILL_FORM", data: rowDict }, () => {
            if (chrome.runtime.lastError) {
              console.warn("Retrying:", chrome.runtime.lastError.message);
              retryTimer = setTimeout(sendMessage, 1000);
            } else {
              sent = true;
              console.log("Delivered on attempt", attempts);
              clearTimeout(retryTimer);
            }
          });
        }
        retryTimer = setTimeout(sendMessage, 1000);
      });
    });

    actionTd.appendChild(btn);
  });

  container.appendChild(table);
}
