import * as mappings from "./mapping.js";

// fields Functions
export async function fillSequence(rowData) {
  const INITIAL_DELAY = 1000;
  const CLICK_DELAY = 1000;

  const fieldMappings = {
    "First Name": "First Name",
    "Last Name": "Last Name",
    "Birth Date (MM/DD/YYYY)": "Birth Date",
    Gender: "Gender",
    "Country of Birth": "Country of Birth",
    next: "next-btn",
    "Company Name": "Company Name",
    "Job Title": "Job Title",
    next2: "next-btn-2",
    "H1B Receipt Number": "H1B Receipt Number",
  };

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  await delay(INITIAL_DELAY);

  for (const [csvKey, elementId] of Object.entries(fieldMappings)) {
    if (csvKey === "next" || csvKey === "next2") {
      const btn = document.getElementById(elementId);
      await delay(CLICK_DELAY);
      if (btn) btn.click();
      continue;
    }

    if (csvKey === "Gender") {
      if (rowData[csvKey] === "MALE")
        document.getElementById("male").checked = true;
      else if (rowData[csvKey] === "FEMALE")
        document.getElementById("female").checked = true;
      continue;
    }

    if (csvKey === "Country of Birth") {
      if (rowData[csvKey] === "India")
        document.getElementById("countryOfBirth").value = "INDIA";
      else if (rowData[csvKey] === "USA")
        document.getElementById("countryOfBirth").value = "USA";
      continue;
    }

    const input = document.getElementById(elementId);
    if (!input) continue;
    input.value = rowData[csvKey] || "";
  }

  await delay(INITIAL_DELAY);
  chrome.runtime.sendMessage({
    type: "FOCUS_POPUP",
    tabId: rowData["popupTabId"],
  });
}

export function fillReceiptNumber(receiptNumber) {
  const noneCheckbox = document.querySelector(
    'input[name="formikFactoryUIMeta.gettingStarted.reasonForRequest.receiptNumber.none"]'
  );
  const numberInput = document.querySelector(
    'input[name="gettingStarted.reasonForRequest.receiptNumber.number"]'
  );

  if (!noneCheckbox || !numberInput) {
    console.error("Receipt-number checkbox or input not found");
    return false;
  }

  const isNone =
    !receiptNumber || String(receiptNumber).trim().toLowerCase() === "none";

  if (isNone) {
    if (!noneCheckbox.checked) {
      noneCheckbox.click();
    }
  } else {
    if (noneCheckbox.checked) {
      noneCheckbox.click();
    }
    numberInput.focus();
    numberInput.value = receiptNumber;
    numberInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return true;
}

export async function selectAutocompleteOption(inputId, optionText) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`No <input id="${inputId}"> found`);
    return false;
  }

  input.focus();
  input.value = optionText;

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
      bubbles: true,
    })
  );

  const listbox = document.querySelector("ul[role='listbox']");
  if (!listbox) {
    console.error(` Listbox did not appear for #${inputId}`);
    return false;
  }

  const options = Array.from(listbox.querySelectorAll("li[role='option']"));
  const match = options.find((li) => li.textContent.trim() === optionText);

  if (!match) {
    console.error(
      ` Option "${optionText}" not found for #${inputId}. ` + `Available:`,
      options.map((o) => o.textContent.trim())
    );
    return false;
  }

  match.click();
  return true;
}

export async function selectDropdownValueForCompany(
  nameOrId,
  value,
  attr = "name",
  timeout = 10000
) {
  if (!value) return false;

  const normalize = (str) => String(str).trim().toLowerCase();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // 1. Try normal <select>
  const selectSelector =
    attr === "id" ? `select[id="${nameOrId}"]` : `select[name="${nameOrId}"]`;
  const select = document.querySelector(selectSelector);

  if (select) {
    const options = select.querySelectorAll("option");
    for (const option of options) {
      if (
        normalize(option.textContent) === normalize(value) ||
        normalize(option.value) === normalize(value)
      ) {
        option.selected = true;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`✅ Selected <select>: "${value}"`);
        return true;
      }
    }
  }

  // 2. Try MUI autocomplete (text input)
  const inputSelector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(inputSelector);
    if (input) {
      input.focus();

      // Set value programmatically (React-safe)
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;
      nativeSetter.call(input, value);

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      await delay(1000);

      const optionSelectors = [
        ".MuiAutocomplete-option",
        '[role="option"]',
        ".MuiMenuItem-root",
      ];

      for (const sel of optionSelectors) {
        const options = document.querySelectorAll(sel);
        for (const option of options) {
          if (normalize(option.textContent) === normalize(value)) {
            option.click();
            console.log(`✅ Selected MUI option: "${value}"`);
            return true;
          }
        }
      }

      input.blur();
      console.warn(
        `⚠️ Autocomplete filled, but option click may have failed: "${value}"`
      );
      return true;
    }

    await delay(300);
  }

  console.error(`❌ Could not find dropdown or input for: ${nameOrId}`);
  return false;
}

export async function selectNonimmigrantClass(rawValue, timeoutMs = 3000) {
  const name = "gettingStarted.reasonForRequest.requestedNonimmigrantClass";
  const start = Date.now();

  // Mapping raw label text to actual input values
  const valueMap = {
    "H-1B": "H1B",
    "H-1B1": "1B1",
    "H-1B2": "1B2",
    "H-1B3": "1B3",
  };

  const expectedValue = valueMap[rawValue.trim()] || rawValue;

  while (Date.now() - start < timeoutMs) {
    const inputs = document.querySelectorAll(`input[name="${name}"]`);
    if (inputs.length > 0) {
      for (const input of inputs) {
        if (input.value === expectedValue) {
          const label = input.closest("label");
          if (label) {
            label.click();
          } else {
            input.click();
          }
          return true;
        }
      }

      console.warn(
        `Radio buttons found for name="${name}" but none matched value="${expectedValue}"`
      );
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.error(`Radio group "${name}" not found within ${timeoutMs}ms`);
  return false;
}

export function selectBasisForClassification(value) {
  value = normalize(value);

  value = mappings.basisForClassificationOptions[value];

  const input = document.querySelector(
    `input[name="gettingStarted.reasonForRequest.basisForClassification"][value="${value}"]`
  );
  if (!input) {
    console.error(`Radio button with value "${value}" not found`);
    return false;
  }
  const label = input.closest("label");
  if (label) {
    label.click();
  } else {
    input.click();
  }
  return true;
}

export async function selectRequestedAction(value, timeoutMs = 3000) {
  value = normalize(value);
  value = mappings.requestedActionOptions[value];
  console.log("Looking for:", value);

  const name = "gettingStarted.reasonForRequest2.requestedAction";
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const inputs = document.querySelectorAll(`input[name="${name}"]`);
    if (inputs.length) {
      for (const input of inputs) {
        if (input.value === value) {
          const label = input.closest("label");
          if (label) {
            label.click();
            console.log(`Clicked label for value="${value}"`);
          } else {
            input.click();
            console.log(`Clicked input for value="${value}"`);
          }
          return true;
        }
      }
      console.error(
        `Found ${inputs.length} radios but none with value="${value}"`
      );
      return false;
    }

    // Not there yet – wait a bit
    await new Promise((r) => setTimeout(r, 100));
  }

  console.error(`Radio group "${name}" did not appear within ${timeoutMs}ms`);
  return false;
}

// higherEducation
export async function higherEduaction(
  nameOrId,
  value,
  attr = "id",
  timeout = 10000
) {
  if (!value) return false;

  // Normalize input for fuzzy matching
  const inputKey = normalize(value);
  const educationLevelMap = {
    "no formal education": "No Formal Education",
    "high school": "High School",
    "some college": "Some College Credit, No Degree",
    associate: "Associate’s degree (for example: AA, AS)",
    bachelor: "Bachelor’s degree (for example: BA, AB, BS)",
    master: "Master's degree (for example: MA, MS, MEng, MEd, MSW, MBA)",
    "master or higher":
      "Master's degree (for example: MA, MS, MEng, MEd, MSW, MBA)",
    doctoral: "Doctorate (PhD or other doctoral degree)",
    doctorate: "Doctorate (PhD or other doctoral degree)",
    professional: "Professional degree (for example: MD, DDS, DVM, LLB, JD)",
  };

  const mappedValue = educationLevelMap[inputKey] || value;

  // Try select first
  const selectSelector =
    attr === "id" ? `select[id="${nameOrId}"]` : `select[name="${nameOrId}"]`;
  let element = document.querySelector(selectSelector);

  if (element) {
    const options = element.querySelectorAll("option");
    for (const option of options) {
      if (
        normalize(option.textContent) === normalize(mappedValue) ||
        normalize(option.value) === normalize(mappedValue)
      ) {
        option.selected = true;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`✅ Selected native dropdown: "${mappedValue}"`);
        return true;
      }
    }
  }

  // Try MUI autocomplete
  const inputSelector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(inputSelector);
    if (input) {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(input, mappedValue);

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));

      await delay(500);

      const optionSelectors = [
        ".MuiAutocomplete-option",
        '[role="option"]',
        ".MuiMenuItem-root",
      ];
      for (const optionSelector of optionSelectors) {
        const options = document.querySelectorAll(optionSelector);
        for (const option of options) {
          if (normalize(option.textContent) === normalize(mappedValue)) {
            option.click();
            console.log(
              `✅ Selected MUI autocomplete option: "${mappedValue}"`
            );
            return true;
          }
        }
      }

      input.blur();
      console.log(`✅ Autocomplete typed and blurred: "${mappedValue}"`);
      return true;
    }
    await delay(200);
  }

  console.error(`❌ Failed to find or select education level: ${mappedValue}`);
  return false;
}
// status of the beneficiary
export async function fillCurrentStatus(statusValue) {
  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const input = document.querySelector(
    'input[id="beneficiaryInfo.immigrationInformation2.nonImmgrantStatusCode"]'
  );

  if (!input) {
    console.warn("❌ Status input not found");
    return false;
  }

  // Clear and type
  input.focus();
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await delay(200);

  input.value = statusValue;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await delay(500);

  const options = Array.from(document.querySelectorAll('li[role="option"]'));

  if (options.length === 0) {
    console.warn("⚠️ No dropdown options found");
    return false;
  }

  // Find exact, partial, or fallback to first option
  const bestMatch =
    options.find(
      (el) => el.textContent.trim().toLowerCase() === statusValue.toLowerCase()
    ) ||
    options.find((el) =>
      el.textContent.toLowerCase().includes(statusValue.toLowerCase())
    ) ||
    options[0];

  bestMatch?.click();
  await delay(300);
  console.log(`✅ Current status set to: ${bestMatch.textContent.trim()}`);
  return true;
}

// special characters input filler
export async function fillInputWithSpecialChars(
  nameOrId,
  value,
  attr = "id",
  timeout = 10000,
  typingDelay = 120,
  specialChars = {
    "&": { delayMultiplier: 2.5, preDelay: 50 },
    "/": { delayMultiplier: 2, preDelay: 30 },
    "-": { delayMultiplier: 1.5 },
    " ": { delayMultiplier: 0.8 },
  }
) {
  // Helper function for delays
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Typing simulation for a single character
  async function typeCharacter(input, char, nativeSetter, baseDelay) {
    const charConfig = specialChars[char] || {};
    const effectiveDelay = baseDelay * (charConfig.delayMultiplier || 1);

    if (charConfig.preDelay) {
      await delay(charConfig.preDelay);
    }

    const prevValue = input.value;
    const newValue = prevValue + char;

    await delay(effectiveDelay);

    nativeSetter.call(input, newValue);

    // Special handling for React controlled components
    if (input._valueTracker) {
      input._valueTracker.setValue(prevValue);
    }

    // Dispatch full suite of events
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent("keyup", { key: char, bubbles: true })
    );
    input.dispatchEvent(
      new KeyboardEvent("keypress", { key: char, bubbles: true })
    );
  }

  // Main function logic
  if (value == null || value === "") {
    console.warn(`⚠️ Skipping: No value provided for ${nameOrId}`);
    return false;
  }

  const selector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;

  const start = Date.now();
  const formattedValue = String(value).trim();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(selector);

    if (input) {
      const isVisible = input.offsetParent !== null;
      const isDisabled =
        input.disabled || input.getAttribute("aria-disabled") === "true";

      if (!isVisible || isDisabled) {
        console.warn(`⚠️ Input ${selector} is hidden or disabled.`);
        return false;
      }

      // Early exit if value already set
      if (input.value === formattedValue) {
        console.log(`ℹ️ Skipped: ${selector} already has correct value.`);
        return true;
      }

      try {
        // Focus the input
        input.focus();

        // Clear existing value (React-safe)
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;

        if (!nativeSetter) {
          throw new Error("Native value setter not found");
        }

        nativeSetter.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));

        // Type each character with appropriate delays
        for (const char of formattedValue) {
          await typeCharacter(input, char, nativeSetter, typingDelay);
        }

        // Final blur + change event to trigger validators
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));

        console.log(`✅ Input filled: ${selector} = "${formattedValue}"`);
        return true;
      } catch (err) {
        console.error(`❌ Typing failed for input ${selector}:`, err);

        // Fallback: Try direct value setting if typing fails
        try {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;

          nativeSetter?.call(input, formattedValue);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          console.log(`✅ Used fallback method for ${selector}`);
          return true;
        } catch (fallbackErr) {
          console.error(
            `❌ Fallback also failed for ${selector}:`,
            fallbackErr
          );
          return false;
        }
      }
    }

    await delay(200);
  }

  console.error(`❌ Input not found after ${timeout}ms: ${selector}`);
  return false;
}

// // AT&T example
// await fillInputWithSpecialChars("company", "AT&T", "name");

// // Gen Al/ML Engineer example
// await fillInputWithSpecialChars("jobTitle", "Gen Al/ML Engineer", "name");

// // Custom special character handling
// await fillInputWithSpecialChars("product", "A/B Testing", "name", 10000, 100, {
//   '/': { delayMultiplier: 3, preDelay: 100 }
// });

// ====================
// 🔁 Basic Utilities
// ====================

// helper functions
export function normalize(value) {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

// delay function
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// React-compatible value setter for MUI inputs
export function setNativeValue(element, value) {
  const lastValue = element.value;
  element.value = value;
  const tracker = element._valueTracker;
  if (tracker) tracker.setValue(lastValue);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

// Typing simulation (React-safe)
export async function typeFormattedValue(selector, value, speed = 100) {
  const input = document.querySelector(selector);
  if (!input)
    return console.warn(`❌ Input not found for selector: ${selector}`);

  input.focus();
  input.value = "";

  let index = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const currentValue = value.slice(0, index + 1);
      setNativeValue(input, currentValue);
      index++;

      if (index === value.length) {
        clearInterval(interval);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.blur();
        console.log("✅ Filled:", currentValue);
        resolve();
      }
    }, speed);
  });
}

// Fill input fields
export async function fillInputField(
  nameOrId,
  value,
  attr = "id",
  timeout = 10000,
  typingDelay = 120
) {
  if (value == null || value === "") {
    console.warn(`⚠️ Skipping: No value provided for ${nameOrId}`);
    return false;
  }

  const selector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(selector);

    if (input) {
      const isVisible = input.offsetParent !== null;
      const isDisabled =
        input.disabled || input.getAttribute("aria-disabled") === "true";

      if (!isVisible || isDisabled) {
        console.warn(`⚠️ Input ${selector} is hidden or disabled.`);
        return false;
      }

      const formattedValue = String(value).trim();

      // Early exit if value already set
      if (input.value === formattedValue) {
        console.log(`ℹ️ Skipped: ${selector} already has correct value.`);
        return true;
      }

      try {
        input.focus();
        input.value = "";

        // 🛡️ Use native setter to update React/MUI-controlled input
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;

        // 🔡 Simulate typing character by character to trigger mask
        for (let i = 0; i < formattedValue.length; i++) {
          const partial = formattedValue.slice(0, i + 1);

          nativeSetter?.call(input, partial);
          input.dispatchEvent(new InputEvent("input", { bubbles: true }));

          await delay(typingDelay);
        }

        // 🧪 Optional: Trigger 'change' or 'blur' if required by library
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.blur();

        console.log(`✅ Typed input filled: ${selector} = "${formattedValue}"`);
        return true;
      } catch (err) {
        console.error(`❌ Typing failed for input ${selector}:`, err);
        return false;
      }
    }

    await delay(200);
  }

  console.error(`❌ Input not found after ${timeout}ms: ${selector}`);
  return false;
}

// Fill a textarea field (React/MUI compatible)
export async function fillTextareaField(
  nameOrId,
  value,
  attr = "id",
  timeout = 10000
) {
  if (!value) return false;

  const selector =
    attr === "id"
      ? `textarea[id="${nameOrId}"]`
      : `textarea[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const textarea = document.querySelector(selector);
    if (textarea) {
      textarea.focus();

      const prototype = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(textarea),
        "value"
      );
      prototype?.set.call(textarea, value);

      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      textarea.blur();

      console.log(`✅ Filled textarea ${selector}: "${value}"`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.error(`❌ Textarea not found: ${selector}`);
  return false;
}

// Select dropdown/autocomplete
export async function selectDropdownValue(
  nameOrId,
  value,
  attr = "id",
  timeout = 10000,
  typingDelay = 150
) {
  if (!value) return false;

  const selectSelector =
    attr === "id" ? `select[id="${nameOrId}"]` : `select[name="${nameOrId}"]`;
  let select = document.querySelector(selectSelector);

  if (select) {
    const options = select.querySelectorAll("option");
    for (const option of options) {
      if (
        normalize(option.textContent) === normalize(value) ||
        normalize(option.value) === normalize(value)
      ) {
        option.selected = true;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`✅ Native <select> value set: "${value}"`);
        return true;
      }
    }
  }

  // MUI Autocomplete handling
  const inputSelector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(inputSelector);
    if (input) {
      input.focus();

      // Clear input
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(input),
        "value"
      ).set;
      setter.call(input, "");
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));

      // Mimic typing each character
      for (let i = 0; i < value.length; i++) {
        const partial = value.slice(0, i + 1);
        setter.call(input, partial);
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        await delay(typingDelay);
      }

      await delay(500);

      const optionSelectors = [
        ".MuiAutocomplete-option",
        '[role="option"]',
        ".MuiMenuItem-root",
      ];

      for (const optionSelector of optionSelectors) {
        const options = document.querySelectorAll(optionSelector);
        for (const option of options) {
          if (normalize(option.textContent) === normalize(value)) {
            option.click();
            console.log(`✅ MUI Autocomplete selected: "${value}"`);
            return true;
          }
        }
      }

      input.blur();
      console.log(`✅ MUI autocomplete fallback filled: "${value}"`);
      return true;
    }

    await delay(300);
  }

  console.error(`❌ Failed to find dropdown/autocomplete: ${inputSelector}`);
  return false;
}

// Select radio option
export async function selectRadioOption(
  nameOrId,
  value,
  attr = "name",
  timeout = 10000
) {
  if (!nameOrId || !value) return false;

  const selector =
    attr === "id"
      ? `input[id="${nameOrId}"][value="${value}"]`
      : `input[name="${nameOrId}"][value="${value}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const radio = document.querySelector(selector);
    if (radio) {
      if (!radio.checked) {
        const label = radio.closest("label");
        if (label) label.click();
        else radio.click();
        console.log(`✅ Selected radio: ${selector}`);
      }
      return true;
    }
    await delay(200);
  }
  console.error(`❌ Radio not found: ${selector}`);
  return false;
}

// Select checkbox
export async function selectCheckbox(
  nameOrId,
  shouldCheck = true,
  attr = "id",
  timeout = 10000
) {
  if (!nameOrId) return false;

  const selector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const checkbox = document.querySelector(selector);
    if (checkbox) {
      if (checkbox.checked !== shouldCheck) {
        const label = checkbox.closest("label");
        if (label) label.click();
        else checkbox.click();
        console.log(
          `✅ ${shouldCheck ? "Checked" : "Unchecked"} checkbox: ${selector}`
        );
      }
      return true;
    }
    await delay(200);
  }
  console.error(`❌ Checkbox not found: ${selector}`);
  return false;
}
// save Button
export async function clickButtonById(button_id) {
  const startBtn = document.getElementById(button_id);
  if (startBtn) {
    startBtn.click();
  }
  console.log(`✅ Clicked button with ID: ${button_id}`);
  return true;
}

// helper for radio option
export async function fillRadioOption(value) {
  if (value == null) return false;

  const map = {
    yes: true,
    y: true,
    true: true,
    1: true,
    no: false,
    n: false,
    false: false,
    0: false,
  };

  const key = String(value).trim().toLowerCase();

  return key in map ? map[key] : Boolean(value);
}

// 📅 Converts Excel serial, MM/DD/YYYY, or ISO string to MM/DD/YYYY
export function formatDate(input) {
  if (!input) return "";

  // If already a proper MM/DD/YYYY string
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) return input;

  // Excel serial date (e.g., "45804.44144135417")
  const serial = Number(input);
  if (!isNaN(serial) && serial > 10000 && serial < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const resultDate = new Date(excelEpoch.getTime() + serial * 86400000);
    const mm = String(resultDate.getMonth() + 1).padStart(2, "0");
    const dd = String(resultDate.getDate()).padStart(2, "0");
    const yyyy = resultDate.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // ISO string or other parseable date
  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    const yyyy = parsed.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  console.warn("⚠️ Unable to format date:", input);
  return input;
}

// date Field
export async function fillDateField(
  nameOrId,
  dateStr,
  attr = "id",
  timeout = 10000,
  typingDelay = 100
) {
  if (!dateStr) {
    console.error("❌ No date string provided");
    return false;
  }

  const formatted = formatDate(dateStr);
  const selector =
    attr === "id" ? `input[id="${nameOrId}"]` : `input[name="${nameOrId}"]`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const input = document.querySelector(selector);
    if (input) {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(input),
        "value"
      ).set;

      setter.call(input, "");
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));

      for (let i = 0; i < formatted.length; i++) {
        const partial = formatted.slice(0, i + 1);
        setter.call(input, partial);
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        await delay(typingDelay);
      }

      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();

      console.log(`✅ Date typed in: "${formatted}"`);
      return true;
    }

    await delay(250);
  }

  console.error(`❌ Date input not found for: ${selector}`);
  return false;
}

// per year
export async function normalizePerUnit(value) {
  const map = {
    hour: "per hour",
    "per hour": "per hour",
    week: "per week",
    "per week": "per week",
    biweekly: "bi-weekly",
    "bi-weekly": "bi-weekly",
    month: "per month",
    "per month": "per month",
    year: "per year",
    "per year": "per year",
    annually: "per year",
  };

  return map[value.toLowerCase()] || null;
}

// ====================
// 🔄 Legacy Aliases
// ====================
export const fillAutocompleteField = selectDropdownValue;
export const selectMuiAutocomplete = selectDropdownValue;

// Simulate human typing for zip codes (MUI compatible)
// export async function simulateHumanTypingZipCodes(selector, value, delay = 80) {
//   const input = document.querySelector(selector);
//   if (!input) {
//     console.error("Input not found for selector:", selector);
//     return;
//   }

//   const strValue = String(value);
//   input.focus();

//   // Clear the input
//   const nativeSetter = Object.getOwnPropertyDescriptor(
//     window.HTMLInputElement.prototype,
//     "value"
//   )?.set;
//   nativeSetter?.call(input, "");
//   input.dispatchEvent(new Event("input", { bubbles: true }));

//   // Simulate typing
//   for (const char of strValue) {
//     const prev = input.value;
//     const next = prev + char;

//     await new Promise((resolve) => setTimeout(resolve, delay));

//     nativeSetter?.call(input, next);

//     // React internal tracker (for compatibility)
//     if (input._valueTracker) {
//       input._valueTracker.setValue(prev);
//     }

//     console.log(`Typing char: ${char} (next: ${next})`);

//     input.dispatchEvent(
//       new KeyboardEvent("keydown", { key: char, bubbles: true })
//     );
//     input.dispatchEvent(new Event("input", { bubbles: true }));
//     input.dispatchEvent(
//       new KeyboardEvent("keyup", { key: char, bubbles: true })
//     );
//   }

//   // Trigger final validation (important for MUI)
//   input.dispatchEvent(new Event("change", { bubbles: true }));
//   input.dispatchEvent(new Event("blur", { bubbles: true }));
// }

export async function simulateHumanTypingZipCodes(selector, value, delay = 80) {
  const input = document.querySelector(selector);
  if (!input || !input.offsetParent || input.disabled) {
    console.error("❌ Input not found, hidden, or disabled:", selector);
    return;
  }

  const strValue = String(value).trim();
  if (!strValue) {
    console.warn("⚠️ Empty ZIP value provided");
    return;
  }

  input.focus();

  // Clear the field first
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeSetter?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Type each character
  for (const char of strValue) {
    const prev = input.value;
    const next = prev + char;
    await new Promise((resolve) => setTimeout(resolve, delay));
    nativeSetter?.call(input, next);

    if (input._valueTracker) input._valueTracker.setValue(prev);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent("keyup", { key: char, bubbles: true })
    );
  }

  // Let React/MUI validate and accept final value
  await new Promise((resolve) => setTimeout(resolve, 100));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

export async function simulateHumanTypingInput(selector, value, delay = 80) {
  const input = document.querySelector(selector);
  if (!input) {
    console.error("❌ Input not found for selector:", selector);
    return;
  }

  const strValue = String(value);
  if (!strValue) {
    console.warn("⚠️ Empty value provided, skipping typing.");
    return;
  }

  // Focus the input
  input.focus();

  // Clear existing value (React-safe)
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!nativeSetter) {
    console.error("❌ Native value setter not found.");
    return;
  }

  nativeSetter.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Simulate typing character-by-character
  for (const char of strValue) {
    const prev = input.value;
    const next = prev + char;

    // Simulate keystroke delay
    await new Promise((r) => setTimeout(r, delay));

    // Set new value using native setter
    nativeSetter.call(input, next);

    if (input._valueTracker) {
      input._valueTracker.setValue(prev);
    }

    console.log(`Typing char: ${char} (next: ${next})`);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent("keyup", { key: char, bubbles: true })
    );
  }

  // Final blur + change event to trigger validators
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

// export async function breakValidationAndSubmit() {
//   console.log("🚨 Breaking validation...");

//   const allInputs = document.querySelectorAll("input, select, textarea");

//   allInputs.forEach((el) => {
//     try {
//       // Remove HTML5 and ARIA validation attributes
//       el.removeAttribute("required");
//       el.removeAttribute("aria-invalid");
//       el.removeAttribute("aria-describedby");

//       // Clear custom validation if any
//       if (typeof el.setCustomValidity === "function") {
//         el.setCustomValidity("");
//       }

//       // Clear input-level validity flags
//       if (el.classList.contains("aria-invalid")) {
//         el.classList.remove("aria-invalid");
//       }

//       // Focus to trigger React/MUI internal listeners
//       el.focus();

//       // Trigger synthetic events to update internal state
//       el.dispatchEvent(new Event("input", { bubbles: true }));
//       el.dispatchEvent(new Event("change", { bubbles: true }));
//       el.dispatchEvent(new Event("blur", { bubbles: true }));
//     } catch (e) {
//       console.warn("⚠️ Skipped element due to error:", el, e);
//     }
//   });

//   // Hide error messages associated via aria-describedby
//   document
//     .querySelectorAll("[id$='-error'], [id$='-helper-text']")
//     .forEach((el) => {
//       el.style.display = "none";
//     });

//   // Hide MUI-specific error helper texts
//   document
//     .querySelectorAll(".MuiFormHelperText-root.Mui-error")
//     .forEach((el) => {
//       el.style.display = "none";
//     });

//   // Remove invalid styling (like red outlines)
//   document.querySelectorAll(".Mui-error").forEach((el) => {
//     el.classList.remove("Mui-error");
//   });

//   console.log("✅ Validation removed and input/blur/change events triggered");
// }

export async function breakValidationAndSubmit() {
  console.log("🚨 Breaking validation...");

  const allInputs = document.querySelectorAll("input, select, textarea");

  allInputs.forEach((el) => {
    try {
      // 1. Remove HTML5 validation flags
      el.removeAttribute("required");
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");

      // 2. Reset native validation
      if (typeof el.setCustomValidity === "function") {
        el.setCustomValidity("");
      }

      // 3. Remove invalid classnames (MUI & custom)
      el.classList.remove("Mui-error", "aria-invalid");

      // 4. Dispatch React-friendly input events
      el.focus();
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    } catch (e) {
      console.warn("⚠️ Skipped element due to error:", el, e);
    }
  });

  // 5. Hide MUI error helper texts
  document
    .querySelectorAll("[id$='-error'], [id$='-helper-text']")
    .forEach((el) => {
      el.style.display = "none";
      el.innerText = "";
    });

  // 6. Remove class-based styling (MUI)
  document
    .querySelectorAll(".Mui-error, .MuiFormHelperText-root.Mui-error")
    .forEach((el) => {
      el.classList.remove("Mui-error");
      el.classList.remove("MuiFormHelperText-root");
    });

  // 7. Remove parent error styling from FormControl
  document.querySelectorAll(".MuiFormControl-root").forEach((formControl) => {
    formControl.classList.remove("Mui-error");
  });

  // 8. Remove any error tooltips/popovers (optional)
  document
    .querySelectorAll('[role="tooltip"], [class*="error"]')
    .forEach((tooltip) => {
      tooltip.style.display = "none";
    });

  console.log("✅ All validation removed. Events dispatched.");
}

export async function saveButton(buttonId, timeout = 10000) {
  const submitBtn =
    document.querySelector(`#${buttonId}`) ||
    document.querySelector(
      'button[type="submit"], input[type="submit"], #table-submit-button'
    );

  if (!submitBtn) {
    console.error(`❌ Submit button not found (ID: "${buttonId}")`);
    return false;
  }

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const isVisible = submitBtn.offsetParent !== null;
    const isEnabled = !submitBtn.disabled;

    if (isVisible && isEnabled) {
      // Optional: Trigger blur on all inputs just before submit
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      });

      submitBtn.click();
      console.log(`✅ Clicked button with ID: ${submitBtn.id || buttonId}`);
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.error(
    `❌ Button with ID "${
      submitBtn.id || buttonId
    }" not clickable within ${timeout}ms`
  );
  return false;
}

// ====================
// 🎯 Batch Field Filler
// ====================

// Fill fields for work section
export async function fillFieldsBatchForWorkSection(fields) {
  for (const field of fields) {
    if (!field?.value && !field.required) continue;

    switch (field.type) {
      case "select":
        await selectDropdownValue(
          field.nameOrId,
          field.value,
          field.attr || "id",
          10000,
          150
        );
        break;

      case "specialChars":
        await fillInputWithSpecialChars(field.nameOrId, field.value);
        break;

      case "zipCode":
        await simulateHumanTypingZipCodes(
          field.nameOrId,
          field.value,
          field.attr || "id"
        );
        break;

      case "radio":
        await selectRadioOption(
          field.nameOrId,
          field.value,
          field.attr || "name",
          10000
        );
        break;

      default:
        await fillInputField(
          field.nameOrId,
          field.value,
          field.attr || "id",
          10000,
          120
        );
    }

    await delay(3000);
    const input =
      field.attr === "id"
        ? document.getElementById(field.nameOrId)
        : document.querySelector(`[${field.attr}="${field.nameOrId}"]`);
    if (input) {
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      
    }
  }
  console.log("✅ All fields filled for work section");
  return true;
}

// This function processes a batch of fields and fills them based on their type
export async function fillFieldsBatch(fields) {
  for (const field of fields) {
    if (!field?.value && !field.required) continue;

    try {
      switch (field.type) {
        case "select":
          await selectDropdownValue(
            field.nameOrId,
            field.value,
            field.attr || "id",
            10000,
            140
          );
          break;
        case "specialChars":
          await fillInputWithSpecialChars(
            field.nameOrId,
            field.value,
            field.attr || "id"
          );
          break;
        case "zipCode":
          await simulateHumanTypingZipCodes(
            field.nameOrId,
            field.value,
            field.attr || "id"
          );
          break;
        case "radio":
          await selectRadioOption(
            field.nameOrId,
            field.value,
            field.attr || "name",
            10000
          );
          break;
        case "checkbox":
          await selectCheckbox(field.nameOrId, field.value, field.attr || "id");
          break;
        case "specialNumbers":
          await simulateHumanTypingInput(field.nameOrId, field.value);
          break;
        case "date":
          await fillDateField(field.nameOrId, field.value);
          break;
        case "textarea":
          await fillTextareaField(field.nameOrId, field.value, field.attr);
          break;
        case "currentStatus":
          await fillCurrentStatus(field.value);
          break;
        case "saveButton":
          await saveButton(field.nameOrId, 10000);
          break;
        case "nextButton":
          await clickButtonById(field.nameOrId);
          break;

        default:
          await fillInputField(
            field.nameOrId,
            field.value,
            field.attr || "id",
            10000,
            120
          );
      }
      await delay(5000);
    } catch (error) {
      console.error(`Error filling field ${field.nameOrId}:`, error);
    }
  }

  console.log("✅ All fields filled for about petitioner");
  return true;
}
