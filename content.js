(async () => {
  console.log("Content script loaded, waiting for helpers…");

  const moduleUrl = chrome.runtime.getURL("form_filler.js");
  try {
    formFiller = await import(moduleUrl);
  } catch (err) {
    throw new Error(`Failed to load form_filler.js: ${err.message}`);
  }

  const preparerInfo = {
    firstName: "Lucas",
    lastName: "Garritson",
    firmName: "Burgos & Garritson Law",
    country: "United States",
    address1: "100 N. Central Expressway",
    address2: "Suite 610",
    city: "Richardson",
    state: "Texas",
    zip: "75080",
    phone: "2147744713",
    fax: null,
    email: "lucas@bgimmlaw.com",
    includeItinerary: "No",
    workInCNMI: "No",
    licenseForEARITAR: "No",
    guamCNMICapExemption: "No",
    guamCNMICapExemptionPreviously: "No",
    ownershipInterest: "No",
    proposedDuties: "See Petitioner's Letter of Support.",
    presentOccupationAndExperience: "See Petitioner's Letter of Support.",
    institutionOfHigherEducation: "No",
    nonprofitOrganization: "No",
    nonprofitResearchOrganization: "No",
    petitionerPrimaryOrSecondaryEducation: "No",
    petitionerNonprofitEntity: "No",
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "FILL_FORM") return;

    console.log(message);

    (async () => {
      if (window.location.pathname.includes("accounts/paralegal/file-form")) {
        await formFiller.delay(5000);
        await formFiller.selectAutocompleteOption(
          "fileForm",
          message.fileFormValue || "I-129, Petition for a Nonimmigrant Worker"
        );

        const rawCompany = message?.data?.["client info"]?.["Company Name"];
        const companyName = rawCompany?.trim()
          ? `Company - ${rawCompany.trim()}`
          : "Company - Unknown Company";

        console.log(companyName);
        await formFiller.delay(5000);
        await formFiller.selectDropdownValueForCompany(
          "client",
          companyName,
          "id"
        );

        await formFiller.delay(5000);
      }

      if (window.location.pathname.includes("paralegal/file-form")) {
        await formFiller.delay(5000);
        formFiller.clickButtonById("start-form");
      }

      if (
        window.location.pathname.includes(
          "petition-for-a-nonimmigrant-worker/start/overview"
        )
      ) {
        await formFiller.delay(2000);
        formFiller.clickButtonById("button-button");
      }

      if (
        window.location.pathname.includes(
          "petition-for-a-nonimmigrant-worker/start/start-application"
        )
      ) {
        await formFiller.delay(2000);
        formFiller.clickButtonById("button-button");
      }

      await formFiller.delay(3000);
      rowData = message.data;
      const clientInfo = rowData["client info"] || {};

      if (
        window.location.pathname.includes("getting-started/reason-for-request")
      ) {
        await formFiller.delay(10000);
        formFiller.selectNonimmigrantClass(
          rowData["Nonimmigrant Classification requested"]
        );
        await formFiller.delay(15000);
        const isCap = await formFiller.fillRadioOption(
          rowData["Cap Exempt"] || "No"
        );
        await formFiller.selectRadioOption(
          "formikFactoryUIMeta.gettingStarted.reasonForRequest.isCap",
          isCap || "false"
        );
        await formFiller.delay(10000);
        formFiller.selectBasisForClassification(
          rowData["Basis of Classification"]
        );

        await formFiller.delay(10000);
        formFiller.fillReceiptNumber(rowData["H1B Receipt Number"]);

        await formFiller.delay(1000);
        formFiller.clickButtonById("button-button");
      }

      if (
        window.location.pathname.includes(
          "getting-started/reason-for-request/reason-for-request-page-2"
        )
      ) {
        await formFiller.delay(10000);
        formFiller.selectRequestedAction(rowData["Action Requesting"]);
        await formFiller.delay(1000);
        formFiller.clickButtonById("button-button");
      }

      // processing information
      if (window.location.pathname.includes("processing-information")) {
        console.log("Processing Information Section: Started");
        await formFiller.delay(10000);
        const isValidPassport = await formFiller.fillRadioOption(
          rowData["Valid Passport"] || "No"
        );
        await formFiller.selectRadioOption(
          "gettingStarted.processingInformation.eachPetitionHasPassport.question",
          isValidPassport || "false"
        );

        await formFiller.delay(10000);
        const hasPassport = await formFiller.fillRadioOption(
          rowData["Replace I-94"] || "No"
        );
        await formFiller.selectRadioOption(
          "gettingStarted.processingInformation.filingReplaceInitialI94.yesNoRadio",
          hasPassport || "false"
        );

        await formFiller.delay(10000);
        const hasApplicationForDependents = await formFiller.fillRadioOption(
          rowData["Dependents"] || "No"
        );
        await formFiller.selectRadioOption(
          "gettingStarted.processingInformation.filingApplicationForDependents.yesNoRadio",
          hasApplicationForDependents || "false"
        );

        await formFiller.delay(10000);
        const isdepedent = await formFiller.fillRadioOption(
          rowData["Dependents"]
        );
        await formFiller.delay(5000);
        if (isdepedent) {
          formFiller.simulateHumanTypingInput(
            "#gettingStarted\\.processingInformation\\.filingApplicationForDependents\\.howMany",
            rowData["Number of Dependents"]
          );
        }
        const isPremiumProcessing = await formFiller.fillRadioOption(
          rowData["Premium Processing"] || "No"
        );
        await formFiller.selectRadioOption(
          "formikFactoryUIMeta.gettingStarted.processingInformation.premiumProcessing",
          isPremiumProcessing || "false"
        );

        await formFiller.delay(1000);
        formFiller.clickButtonById("button-button");
        console.log("Processing Information Section: Completed");
      }

      // Preparer information
      if (window.location.pathname.includes("preparer-information")) {
        await formFiller.delay(10000);
        const preparerFields = [
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.name.firstName",
            value: preparerInfo.firstName || "Lucas",
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId: "gettingStarted.preparer.helperInformation.name.lastName",
            value: preparerInfo.lastName || "Garritson",
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId: "gettingStarted.preparer.helperInformation.business",
            value: preparerInfo.business || "Burgos",
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "gettingStarted.preparer.helperInformation.firmName",
            value: preparerInfo.firmName || "Burgos & Garritson Law",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.address.addressLineOne",
            value: preparerInfo.address1 || "100 N. Central Expressway",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.address.addressLineTwo",
            value: preparerInfo.address2 || "Suite 610",
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "gettingStarted.preparer.helperInformation.address.city",
            value: preparerInfo.city || "Richardson",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.contact.daytimePhone",
            value: preparerInfo.phone || "2147744713",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.contact.faxNumber",
            value: preparerInfo.fax || "",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.contact.emailAddress",
            value: preparerInfo.email || "lucas@bgimmlaw.com",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "gettingStarted.preparer.helperInformation.address.country",
            value: preparerInfo.country || "United States",
            attr: "name",
            type: "select",
          },
          {
            nameOrId: "gettingStarted.preparer.helperInformation.address.state",
            value: preparerInfo.state || "Texas",
            attr: "name",
            type: "select",
          },
          {
            nameOrId:
              "#gettingStarted\\.preparer\\.helperInformation\\.address\\.zipCode",
            value: preparerInfo.zip ? String(preparerInfo.zip) : "75080",
            attr: "id",
            type: "zipCode",
          },
        ];
        const res = await formFiller.fillFieldsBatch(preparerFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
      }

      // About petitioner - name
      if (
        window.location.pathname.includes("about-petitioner/petitioner-name")
      ) {
        await formFiller.delay(10000);
        const petitionerNameFields = [
          {
            nameOrId: "applicant.yourName.companyOrOrganizationName",
            value: clientInfo["Company Name"],
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId: "applicant.yourName.titleOfAuthorizedSignatory",
            value: clientInfo["Title"],
            attr: "id",
            type: "text",
            required: true,
          },
        ];
        const res = await formFiller.fillFieldsBatch(petitionerNameFields);

        if (res) await formFiller.clickButtonById("button-button");
      }

      // About petitioner - contact information
      if (
        window.location.pathname.includes(
          "about-petitioner/petitioner-contact-information"
        )
      ) {
        await formFiller.delay(10000);
        const petitionerContactFields = [
          {
            nameOrId: "applicant.contactInfo.otherContact.daytimePhone",
            value: clientInfo["Phone"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.otherContact.emailAddress",
            value: clientInfo["Email"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.inCareOfName",
            value: clientInfo["Company Name"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.addressLineOne",
            value: clientInfo["Address 1"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.addressLineTwo",
            value: clientInfo["Address 2"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.country",
            value: clientInfo["Country"],
            attr: "name",
            type: "select",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.addressLineOne",
            value: clientInfo["Address 1"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.city",
            value: clientInfo["City"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "applicant.contactInfo.mailingAddress.state",
            value:
              clientInfo["State"] === "GA" ? "Georgia" : clientInfo["State"],
            attr: "name",
            type: "select",
          },
          {
            nameOrId: "#applicant\\.contactInfo\\.mailingAddress\\.zipCode",
            value: String(clientInfo["Zip"]),
            attr: "id",
            type: "zipCode",
          },
        ];

        await formFiller.selectCheckbox(
          "formikFactoryUIMeta.applicant.contactInfo.otherContact.sameAsDaytimePhone",
          Boolean(clientInfo["Phone"]),
          "id"
        );

        await formFiller.delay(10000);
        const res = await formFiller.fillFieldsBatch(petitionerContactFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
      }

      // ✅ About petitioner - other information
      if (
        window.location.pathname.includes("about-petitioner/other-information")
      ) {
        await formFiller.delay(10000);
        const petitionerOtherFields = [
          {
            nameOrId: "#applicant\\.otherInfo\\.fein",
            value: clientInfo["EIN"],
            type: "specialNumbers",
          },
          {
            nameOrId: "#applicant\\.otherInfo\\.irsTaxNumber\\.number",
            value: clientInfo["IRS Tax Number"],
            type: "specialNumbers",
          },
          {
            nameOrId: "#applicant\\.otherInfo\\.socialSecurityNumber\\.number",
            value: rowData["Employee SSN"] || "",
            type: "specialNumbers",
          },
        ];

        const res = await formFiller.fillFieldsBatch(petitionerOtherFields);

        await formFiller.delay(10000);
        // Radio: Exempt status
        const isExempt = await formFiller.fillRadioOption(
          rowData["PAID HIGHER"]
        );
        await formFiller.selectRadioOption(
          "h1b1DataCollection.generalInformation.h1bNonimmigrantExempt",
          isExempt || "false",
          "id"
        );

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
      }

      // About petitioner - other information - page 2
      if (
        window.location.pathname.includes(
          "about-petitioner/other-information/other-information-page-2"
        )
      ) {
        await formFiller.delay(10000);
        const petitionerOtherPage2Fields = [
          {
            nameOrId: "applicant.otherInfo.socialSecurityNumber.number",
            value: clientInfo["EIN"],
            attr: "id",
            type: "specialNumbers",
            required: !!clientInfo["EIN"],
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          petitionerOtherPage2Fields
        );

        await formFiller.delay(10000);
        const radioValue =
          (await formFiller.fillRadioOption(
            clientInfo["Is Nonprofit or Higher Edu"]
          )) || "false";
        if (radioValue !== undefined) {
          await formFiller.selectRadioOption(
            "applicant.otherInfo.asylumFeeExemptEmployerNonProfitUSHigherEdu",
            radioValue,
            "name"
          );
        }
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
      }

      // About beneficiary - name
      if (
        window.location.pathname.includes("about-beneficiary/beneficiary-name")
      ) {
        await formFiller.delay(10000);
        const beneficiaryNameFields = [
          {
            nameOrId: "beneficiaryInfo.beneficiaryName.name.firstName",
            value: rowData["First Name"],
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId: "beneficiaryInfo.beneficiaryName.name.middleName",
            value: rowData["Middle Name"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "beneficiaryInfo.beneficiaryName.name.lastName",
            value: rowData["Last Name"],
            attr: "id",
            type: "text",
            required: true,
          },
        ];
        const res = await formFiller.fillFieldsBatch(beneficiaryNameFields);
        const hasAdditionalNames = await formFiller.fillRadioOption(
          rowData["Other Names Used"]
        );
        await formFiller.delay(10000);
        await formFiller.selectRadioOption(
          "formikFactoryUIMeta.beneficiaryInfo.beneficiaryName.additionalNames.hasAdditionalNames",
          hasAdditionalNames || "false",
          "name"
        );
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
      }

      // About beneficiary - contact information
      if (
        window.location.pathname.includes(
          "about-beneficiary/beneficiary-contact-information"
        )
      ) {
        console.log(
          "about-beneficiary beneficiary Information autofill started"
        );
        await formFiller.delay(10000);

        const beneficiaryContactFields = [
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.mailingAddress.addressLineOne",
            value: rowData["Address 1"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.mailingAddress.addressLineTwo",
            value: rowData["Address 2"] || "",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.mailingAddress.city",
            value: rowData["City"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.mailingAddress.state",
            value: rowData["State"] === "GA" ? "Georgia" : rowData["State"],
            attr: "id",
            type: "select",
          },
          {
            nameOrId:
              "#beneficiaryInfo\\.beneficiaryContactInformation\\.mailingAddress\\.zipCode",
            value: rowData["Zip"],
            attr: "id",
            type: "zipCode",
          },
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.officeType",
            value: rowData["Type of Office"],
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "formikFactoryUIMeta.beneficiaryInfo.beneficiaryContactInformation.country",
            value: rowData["What country"] || rowData["Country"],
            attr: "id",
            type: "select",
          },
          {
            nameOrId:
              "beneficiaryInfo.beneficiaryContactInformation.officeCity",
            value: rowData["What city"] || rowData["City"],
            attr: "id",
            type: "text",
          },
        ];

        const isUS = await formFiller.fillRadioOption(rowData["In the US"]);
        await formFiller.selectRadioOption(
          "formikFactoryUIMeta.beneficiaryInfo.beneficiaryContactInformation.isUnitedStates",
          isUS || "false"
        );

        await formFiller.delay(10000);
        const res = await formFiller.fillFieldsBatch(beneficiaryContactFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("✅ Beneficiary Contact Information autofill completed");
      }

      // About beneficiary - birth information
      if (
        window.location.pathname.includes(
          "about-beneficiary/when-and-where-they-were-born"
        )
      ) {
        console.log("when they born autofill started");
        await formFiller.delay(10000);

        const beneficiaryBirthFields = [
          {
            nameOrId: "beneficiaryInfo.whenAndWhereTheyWereBorn.dateOfBirth",
            value: rowData["Birth Date (MM/DD/YYYY)"],
            attr: "id",
            type: "date",
            required: true,
          },
          {
            nameOrId: "beneficiaryInfo.whenAndWhereTheyWereBorn.country",
            value: rowData["Country of Birth"],
            attr: "id",
            type: "select",
            required: true,
          },
          ...(rowData["Province of Birth"]
            ? [
                {
                  nameOrId: "beneficiaryInfo.whenAndWhereTheyWereBorn.province",
                  value: rowData["Province of Birth"],
                  attr: "id",
                  type: "text",
                },
              ]
            : []),
        ];

        const res = await formFiller.fillFieldsBatch(beneficiaryBirthFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("when they born close");
      }

      // About beneficiary - immigration information
      if (
        window.location.pathname.includes(
          "about-beneficiary/immigration-information"
        )
      ) {
        console.log("✅ Immigration Information autofill started");
        await formFiller.delay(10000);

        const beneficiaryImmigrationFields = [
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation.dateOfLastArrival",
            value: rowData["Last Arrival (MM/DD/YYYY)"],
            attr: "id",
            type: "date",
          },
          {
            nameOrId: "beneficiaryInfo.immigrationInformation.i94Number",
            value: rowData["I-94"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation.passportOrTravelDocumentNumber",
            value: rowData["Passport Number"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation.passportOrTravelDocumentIssueDate",
            value: rowData["Passport Issued (MM/DD/YYYY)"],
            attr: "id",
            type: "date",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation.passportOrTravelDocumentExpirationDate",
            value: rowData["Passport Expire (MM/DD/YYYY)"],
            attr: "id",
            type: "date",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation.passportOrTravelDocumentCountryOfIssuance",
            value: rowData["Passport Country"],
            attr: "id",
            type: "select",
          },
        ];

        // I-94 Checkbox (if blank I-94)
        if (!rowData["I-94"]) {
          await formFiller.selectCheckbox(
            "formikFactoryUIMeta.beneficiaryInfo.immigrationInformation.noI94Number",
            Boolean(rowData["I-94"]?.trim()),
            "id"
          );
        }

        const res = await formFiller.fillFieldsBatch(
          beneficiaryImmigrationFields
        );
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("✅ Immigration Information autofill completed");
      }

      // immigration-information page 2
      if (
        window.location.pathname.includes(
          "about-beneficiary/immigration-information/immigration-information-page-2"
        )
      ) {
        console.log("🟡 Immigration Information Page 2 started");
        await formFiller.delay(10000);

        const beneficiaryImmigrationPage2Fields = [
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation2.nonImmgrantStatusCode",
            value: rowData["Current Status"],
            attr: "id",
            type: "currentStatus",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation2.statusExpirationDate",
            value: rowData["Status Expire (MM/DD/YYYY)"],
            attr: "id",
            type: "date",
          },
          {
            nameOrId: "beneficiaryInfo.immigrationInformation2.sevisNumber",
            value: rowData["SEVIS (if any)"]
              ? rowData["SEVIS (if any)"].replace(/^N/, "")
              : "",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationInformation2.eadNumber.number",
            value: rowData["EAD Number"],
            attr: "id",
            type: "text",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          beneficiaryImmigrationPage2Fields
        );

        // "No Status Expiration" checkbox
        if (rowData["No Status Expiration"] === true) {
          await formFiller.selectCheckbox(
            "formikFactoryUIMeta.beneficiaryInfo.immigrationInformation2.noStatusExpirationDate",
            true,
            "id"
          );
        }

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("✅ Immigration Information Page 2 completed");
      }

      // About beneficiary - immigration history
      if (
        window.location.pathname.includes(
          "about-beneficiary/immigration-history"
        )
      ) {
        console.log("immigration history started");
        await formFiller.delay(10000);

        const isRemoval = await formFiller.fillRadioOption(
          rowData["Removal Proceedings"]
        );
        const isBeneficiary = await formFiller.fillRadioOption(
          rowData["Immigrant Petition (I-140) with current employer"]
        );
        const isNonImmigration = await formFiller.fillRadioOption(
          rowData[
            "Nonimmigrant Petition filed prior (H-1) with current employer"
          ] || "No"
        );

        const beneficiaryImmigrationHistoryFields = [
          {
            nameOrId: "beneficiaryInfo.immigrationHistory.beneficiaryInRemoval",
            value: isRemoval || "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationHistory.filedForAnyBeneficiary.yesNoRadio",
            value: isBeneficiary || "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "beneficiaryInfo.immigrationHistory.everPreviouslyFiledForBeneficiary.question",
            value: isNonImmigration,
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "textarea[id='formikFactoryUIMeta.beneficiaryInfo.immigrationHistory.everPreviouslyFiledForBeneficiary.explanation']",
            value: "",
            attr: "id",
            type: "text",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          beneficiaryImmigrationHistoryFields
        );
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("immigration history closed");
      }

      if (
        window.location.pathname.includes(
          "about-beneficiary/immigration-history/immigration-history-page-2"
        )
      ) {
        await formFiller.delay(10000);
        console.log("immigration history page 2 started");

        const beneficiaryImmigrationHistoryPage2Fields = [
          {
            nameOrId: "beneficiaryInfo.immigrationHistory2.heldJVisa",
            value: rowData["Employee Had J-1"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          beneficiaryImmigrationHistoryPage2Fields
        );
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("immigration history page 2 completed");
      }

      // About beneficiary - other information
      if (
        window.location.pathname.includes(
          "about-beneficiary/beneficiarys-other-information"
        )
      ) {
        await formFiller.delay(10000);
        console.log("Other Information Section: Started");

        const citizenshipValue =
          rowData["What country"] || clientInfo["Country"];
        const gender = (rowData["Gender"] || "").toLowerCase();
        const genderValue =
          gender === "male" ? "3" : gender === "female" ? "1" : null;
        const aNumber = (rowData["A-Number"] || "").trim();
        const isANumberMissing = !aNumber;
        const ssn = (
          rowData["Employee SSN"] ||
          rowData["Employee SSN\t"] ||
          ""
        ).trim();
        const isSSNMissing = !ssn;

        const beneficiaryOtherFields = [
          {
            nameOrId: "beneficiaryInfo.otherInformation.citizenshipCountry",
            value: citizenshipValue,
            attr: "id",
            type: "select",
            required: !!citizenshipValue,
          },
          {
            nameOrId: "beneficiaryInfo.otherInformation.gender",
            value: genderValue,
            attr: "name",
            type: "radio",
            required: !!genderValue,
          },
          {
            nameOrId: "beneficiaryInfo.otherInformation.alienNumber.number",
            value: aNumber,
            attr: "id",
            type: "text",
            required: !isANumberMissing,
          },
          {
            nameOrId:
              "#beneficiaryInfo\\.otherInformation\\.socialSecurityNumber\\.number",
            value: ssn,
            attr: "id",
            type: "specialNumbers",
            required: !isSSNMissing,
          },
        ];

        const res = await formFiller.fillFieldsBatch(beneficiaryOtherFields);

        // A-Number checkbox
        await formFiller.selectCheckbox(
          "formikFactoryUIMeta.beneficiaryInfo.otherInformation.alienNumber.none",
          isANumberMissing,
          "id"
        );

        // SSN checkbox
        await formFiller.selectCheckbox(
          "formikFactoryUIMeta.beneficiaryInfo.otherInformation.socialSecurityNumber.none",
          isSSNMissing,
          "id"
        );

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("Other Information Section: Completed");
      }

      // Employment - basic information
      if (window.location.pathname.includes("employment/basic-information")) {
        await formFiller.delay(10000);
        console.log("Basic Information Started");

        const employmentBasicFields = [
          {
            nameOrId: "employment.basicInformation.jobTitle",
            value: rowData["Job Title"] || "",
            attr: "id",
            type: "specialChars",
          },
          {
            nameOrId: "employment.basicInformation.lcaOrEtaCaseNumber",
            value: rowData["LCA CASE NUMBER"],
            attr: "id",
            type: "text",
            required: !!rowData["LCA CASE NUMBER"],
          },
          {
            nameOrId: "employment.basicInformation.fulltime",
            value: await formFiller.fillRadioOption(
              rowData["Full Time"] || "No"
            ),
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "#employment\\.basicInformation\\.wage\\.amount",
            value: rowData["Wage Amount"],
            attr: "id",
            type: "specialNumbers",
          },
          {
            nameOrId: "employment.basicInformation.wage.rate",
            value: await formFiller.normalizePerUnit(rowData["PER"]),
            attr: "id",
            type: "select",
          },
          {
            nameOrId:
              "formikFactoryUIMeta.employment.basicInformation.otherCompensation.anyOtherCompensation",
            value:
              (await formFiller.fillRadioOption(
                rowData["Other Compensation"] || "No"
              )) || "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "employment.basicInformation.otherCompensation.description",
            value:
              rowData["Other Compensation Description"] ||
              "Performance-based bonuses",
            attr: "id",
            type: "text",
            required:
              (await formFiller.fillRadioOption(
                rowData["Other Compensation"] || "No"
              )) === "true",
          },
          {
            nameOrId:
              "employment.basicInformation.datesOfIntendedEmployment.fromDate",
            value:
              rowData["Date of Intended Employment (FROM MM/DD/YYYY)"] || "",
            attr: "id",
            type: "date",
          },
          {
            nameOrId:
              "employment.basicInformation.datesOfIntendedEmployment.toDate",
            value: rowData["Date of Intended Employment (TO MM/DD/YYYY)"] || "",
            attr: "id",
            type: "date",
          },
        ];

        const res = await formFiller.fillFieldsBatch(employmentBasicFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("Basic Information Closed");
      }

      // Employment - employer information
      if (
        window.location.pathname.includes("employment/employer-information")
      ) {
        await formFiller.delay(10000);
        console.log("employer information started");

        const employmentEmployerFields = [
          {
            nameOrId: "employment.employerInformation.typeOfBusiness",
            value: clientInfo["Type of Business"],
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "employment.employerInformation.yearBusinessEstablished",
            value: clientInfo["Year Established"],
            attr: "id",
            type: "text",
            required: !!clientInfo["Year Established"],
          },
          {
            nameOrId:
              "employment.employerInformation.currentNumberOfEmployeesInUS",
            value: clientInfo["Number of Employees"],
            attr: "id",
            type: "text",
            required: !!clientInfo["Number of Employees"],
          },
          {
            nameOrId:
              "employment.employerInformation.currentlyEmployTotalOf25OrFewerFullTime",
            value: await formFiller.fillRadioOption(
              clientInfo["Employ More Than 25"]
            ),
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "#employment\\.employerInformation\\.grossAnnualIncome",
            value: clientInfo["Gross Annual Income"]
              ? String(clientInfo["Gross Annual Income"]).replace(/[^\d.]/g, "")
              : "",
            attr: "id",
            type: "specialNumbers",
            required: !!clientInfo["Gross Annual Income"],
          },
          {
            nameOrId: "#employment\\.employerInformation\\.netAnnualIncome",
            value: clientInfo["Net Annual Income"]
              ? String(clientInfo["Net Annual Income"]).replace(/[^\d.]/g, "")
              : "",
            attr: "id",
            type: "specialNumbers",
            required: !!clientInfo["Net Annual Income"],
          },
        ];

        const res = await formFiller.fillFieldsBatch(employmentEmployerFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("employer information closed");
      }

      // Employment - work location
      if (window.location.pathname.includes("employment/work-location")) {
        await formFiller.delay(5000);
        console.log(" Work Location autofill started...");

        // Step 1: Set initial radio option
        await formFiller.selectRadioOption(
          "formikFactoryUIMeta.employment.workLocation.sameAsMailing",
          "true"
        );

        await formFiller.delay(15000);

        // Step 2: Add additional work address
        await formFiller.clickButtonById("add_button");
        console.log("Additional work address added");
        await formFiller.delay(2000);

        // Define work location fields
        const workLocationFields = [
          {
            nameOrId:
              "employment.workLocation.additionalWorkAddresses.0.addressLineOne",
            value: rowData["WORK ADDRESS 1"],
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId:
              "employment.workLocation.additionalWorkAddresses.0.addressLineTwo",
            value: rowData["WORK ADDRESS 2"] || "",
            attr: "id",
            type: "text",
          },
          {
            nameOrId: "employment.workLocation.additionalWorkAddresses.0.city",
            value: rowData["WORK CITY"] || "",
            attr: "id",
            type: "text",
            required: true,
          },
          {
            nameOrId: "employment.workLocation.additionalWorkAddresses.0.state",
            value:
              rowData["WORK STATE"] === "GA"
                ? "Georgia"
                : rowData["WORK STATE"],
            attr: "id",
            type: "select",
            required: true,
          },
          {
            nameOrId:
              "#employment\\.workLocation\\.additionalWorkAddresses\\.0\\.zipCode",
            value: rowData["WORK ZIP"],
            attr: "id",
            type: "zipCode",
          },
          {
            nameOrId:
              "employment.workLocation.additionalWorkAddresses.0.thirdPartyLocation",
            value: rowData["Name of 3rd party (Work Location)"]?.trim()
              ? "true"
              : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "employment.workLocation.additionalWorkAddresses.0.thirdPartyCompanyName",
            value: rowData["Name of 3rd party (Work Location)"] || "",
            attr: "id",
            type: "specialChars",
          },
        ];

        // Step 3: Fill all fields
        const response = await formFiller.fillFieldsBatchForWorkSection(
          workLocationFields
        );

        for (let i = 0; i <= 8; i++) {
          await formFiller.saveButton("table-submit-button");
          await formFiller.breakValidationAndSubmit();
          const evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
          });
          document.body.dispatchEvent(evt);

          await formFiller.delay(5000);
        }

        // if (response === true) {
        //   // Step 4: Handle validation and submission
        //   for (let i = 0; i < 10; i++) {
        //     await formFiller.breakValidationAndSubmit();
        //     await formFiller.delay(8000);
        //     await formFiller.saveButton("table-submit-button");
        //     await formFiller.delay(3000);
        //   }
        // } else {
        //   await formFiller.saveButton("table-submit-button");
        // }

        // Final steps
        await formFiller.delay(5000);
        await formFiller.clickButtonById("button-button");
        console.log("✅ Work Location autofill completed");
      }

      // Employmwnt - work location - 2
      if (
        window.location.pathname.includes(
          "employment/work-location/work-location-2"
        )
      ) {
        await formFiller.delay(10000);
        console.log("work location 2 started");

        const includeItinerary =
          (await formFiller.fillRadioOption(
            rowData["Include Itinerary"] || "No"
          )) || "false";
        const workOffsite =
          (await formFiller.fillRadioOption(rowData["Work Off -Site"])) ||
          "false";
        const workInCNMI =
          (await formFiller.fillRadioOption(rowData["Work in CNMI"] || "No")) ||
          "false";
        const licenseForEARITAR = await formFiller.fillRadioOption(
          rowData["License for EARITAR"]
        );

        const employmentWorkLocation2Fields = [
          {
            nameOrId: "employment.workLocation2.itineraryIncluded",
            value: includeItinerary,
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "employment.workLocation2.workOffSite",
            value: workOffsite,
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "employment.workLocation2.workInCNMI",
            value: workInCNMI,
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "employment.workLocation2.licenseForEARITAR",
            value: licenseForEARITAR,
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          employmentWorkLocation2Fields
        );
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("work location 2 closed");
      }

      // employment/release-of-controlled-technology-certification
      if (
        window.location.pathname.includes(
          "employment/release-of-controlled-technology-certification"
        )
      ) {
        await formFiller.delay(10000);
        console.log("Export Control Tech Certification started");

        const employmentReleaseTechFields = [
          {
            nameOrId:
              "employment.releaseOfTechOrTechnicalData.certRegardingReleaseOfControlTech",
            value: "License Is Not Required From Dept Commerce Or State",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          employmentReleaseTechFields
        );
        await formFiller.delay(5000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("Export Control Tech Certification closed");
      }

      // h-classification supplement general information
      if (
        window.location.pathname.includes(
          "h-classification-supplement/general-information"
        )
      ) {
        console.log(
          "🚀 H Classification Supplement: General Information - Started"
        );
        await formFiller.delay(15000);

        const data = {
          passportNumber: rowData["Passport Number"] || "",
          countryOfIssuance: rowData["Country of Issuance"] || "",
          expirationDate: rowData["Passport Expire (MM/DD/YYYY)"] || "",
          beneficiaryGuamCapExempt:
            rowData["Guam CNMI Exemption – Beneficiary"] || "false",
          changeEmployerGuamCapExempt:
            rowData["Guam CNMI Exemption – Change Employer"] || "false",
        };

        const hClassificationGeneralFields = [
          {
            nameOrId:
              "hClassificationSupplement.generalInformation.capBeneficiaryPassportNumber",
            value: data.passportNumber,
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "hClassificationSupplement.generalInformation.capBeneficiaryPassportOrTravelDocCountryOfIssuance",
            value: data.countryOfIssuance,
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "hClassificationSupplement.generalInformation.capBeneficiaryPassportOrTravelDocExpirationDate",
            value: data.expirationDate,
            attr: "id",
            type: "date",
          },
          {
            nameOrId:
              "hClassificationSupplement.generalInformation.beneficiaryGuamCNMI",
            value: data.beneficiaryGuamCapExempt,
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "hClassificationSupplement.generalInformation.changeEmployerGuamCNMI",
            value: data.changeEmployerGuamCapExempt,
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          hClassificationGeneralFields
        );

        // Click Next Button (Direct DOM)
        await formFiller.delay(1000);
        const nextButton = document.querySelector("#button-button");
        if (res && nextButton && !nextButton.disabled) {
          nextButton.scrollIntoView({ behavior: "smooth", block: "center" });
          nextButton.click();
          console.log("👉 Clicked Next button directly");
        } else {
          console.warn("⚠️ Next button not found or disabled");
        }

        console.log(
          "✅ H Classification Supplement: General Information - Completed"
        );
      }

      // h-classification-supplement/beneficiary-information
      if (
        window.location.pathname.includes(
          "h-classification-supplement/beneficiary-information"
        )
      ) {
        console.log("⚙️ H-Classification Supplement autofill started...");
        await formFiller.delay(10000);

        const priorFromDate = rowData["Prior H From Date"];
        const priorToDate = rowData["Prior H To Date"];
        const isStillPresent = !priorToDate;

        const hClassificationBeneficiaryFields = [
          {
            nameOrId:
              "hClassificationSupplement.beneInformation.priorHClassStays.0.fromDate",
            value: priorFromDate,
            attr: "id",
            type: "date",
          },
          {
            nameOrId:
              "hClassificationSupplement.beneInformation.priorHClassStays.0.toDate",
            value: priorToDate,
            attr: "id",
            type: "date",
            required: !isStillPresent,
          },
          {
            nameOrId:
              "hClassificationSupplement.beneInformation.beneficiaryHaveOwnership.question",
            value: "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "hClassificationSupplement.beneInformation.beneficiaryCurrentDuties",
            value:
              rowData["Current Duties"] ||
              "Software development and maintenance",
            attr: "id",
            type: "text",
          },
          {
            nameOrId:
              "hClassificationSupplement.beneInformation.beneficiaryProposedDuties",
            value:
              rowData["Proposed Duties"] ||
              "Machine learning model design and deployment",
            attr: "id",
            type: "text",
          },
        ];

        const res = await formFiller.fillFieldsBatch(
          hClassificationBeneficiaryFields
        );

        // Handle "to present" checkbox if needed
        if (isStillPresent) {
          await formFiller.selectCheckbox(
            "hClassificationSupplement.beneInformation.priorHClassStays.0.toPresent",
            true,
            "id"
          );
        }

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("✅ H-Classification Supplement autofill completed.");
      }

      // ------------------------------
      // H-1B Supplement: General Information
      // ------------------------------
      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/general-information"
        )
      ) {
        console.log("H-1B Supplement: General Information started");

        const isExempt =
          rowData["Rate of Pay Per Year"] === "Yes (High salary)" ||
          rowData["Highest Education Level"] === "Yes (Master's)";

        const h1bGeneralFields = [
          {
            nameOrId:
              "h1b1DataCollection.generalInformation.h1bDependentEmployer",
            value: clientInfo["H-1B Dependnet"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId: "h1b1DataCollection.generalInformation.willfulViolater",
            value: clientInfo["Willfull Violator"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.generalInformation.h1bNonimmigrantExempt",
            value: isExempt ? "true" : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.generalInformation.employMoreThan50Individuals",
            value:
              clientInfo["Employ More Than 50"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.generalInformation.moreThan50PercentH1BL1",
            value: "false",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(h1bGeneralFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("H-1B Supplement: General Information completed");
      }

      // ------------------------------
      // H-1B Supplement: Beneficiary Information
      // ------------------------------
      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/beneficiary-information"
        )
      ) {
        console.log("H-1B Supplement: Beneficiary Information started");

        const hasMajor = !!rowData["What Major for Degree"];

        const h1bBeneficiaryFields = [
          {
            nameOrId:
              "h1b1DataCollection.beneficiaryInformation.highestLevelOfEducation",
            value: rowData["Highest Education Level"],
            attr: "id",
            type: "select",
          },
          {
            nameOrId:
              "h1b1DataCollection.beneficiaryInformation.majorPrimaryFieldOfStudy",
            value: rowData["What Major for Degree"],
            attr: "id",
            type: "text",
            required: hasMajor,
          },
          {
            nameOrId:
              "#h1b1DataCollection\\.beneficiaryInformation\\.rateOfPayPerYear",
            value: rowData["Rate of Pay Per Year"],
            attr: "id",
            type: "specialNumbers",
          },
          {
            nameOrId: "#h1b1DataCollection\\.beneficiaryInformation\\.dotCode",
            value: clientInfo["DOT"],
            attr: "id",
            type: "specialNumbers",
          },
          {
            nameOrId: "h1b1DataCollection.beneficiaryInformation.naicsCode",
            value: clientInfo["NAICS"],
            attr: "id",
            type: "text",
          },
        ];

        const res = await formFiller.fillFieldsBatch(h1bBeneficiaryFields);

        // Handle "no major" checkbox
        await formFiller.selectCheckbox(
          "formikFactoryUIMeta.h1b1DataCollection.beneficiaryInformation.noMajorPrimaryFieldOfStudy",
          !hasMajor,
          "id"
        );

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("H-1B Supplement: Beneficiary Information completed");
      }

      // Fee Exemption and/or Determination Page 1
      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/fee-exemption-and-or-determination"
        )
      ) {
        await formFiller.delay(10000);
        console.log("h1-b fee exemption and determination started");

        const feeExemptionFields = [
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination.institutionOfHigherLearning",
            value: "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination.nonProfitOrgRelatedToHigherEd",
            value:
              clientInfo["Nonprofit or Educational Institution"] === "Yes"
                ? "true"
                : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination.nonProfitResearchOrgOrGovResearchOrg",
            value: "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination.secondRequestForExtForPetitioner",
            value:
              rowData["Second Extension with SAME Employer"] === "Yes"
                ? "true"
                : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination.amendedPetitionDoesNotContainRequestForStay",
            value: rowData["AMENDMENT only"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(feeExemptionFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("h1-b fee exemption and determination closed");
      }

      // Fee Exemption and/or Determination Page 2
      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/fee-exemption-and-or-determination/fee-exemption-and-or-determination-page-2"
        )
      ) {
        await formFiller.delay(10000);
        console.log("h1-b fee exemption and determination page 2 started");

        const feeExemptionPage2Fields = [
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination2.isFilingToCorrectUSCISError",
            value:
              rowData["Correcting USCIS ERROR"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination2.isPrimaryOrSecondaryEducation",
            value: "false",
            attr: "name",
            type: "radio",
          },
          {
            nameOrId:
              "h1b1DataCollection.feeExemptionDetermination2.isNonProfitClinicalTraining",
            value: "false",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(feeExemptionPage2Fields);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("h1-b fee exemption and determination page 2 closed");
      }

      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/numerical-limitation-information"
        )
      ) {
        await formFiller.delay(10000);
        console.log("h1-b numerical limitation information started");

        const H1B_TYPE_MAP = {
          "Cap H-1B Bachelor's Degree": "CAP H1B BACHELORS",
          "Cap H-1B U.S. Master's Degree or Higher": "CAP H1B MASTERS",
          "Cap H-1B1 Chile/Singapore": "CAP H1B1 CHILE SINGAPORE",
          "Cap Exempt": "CAP EXEMPT",
        };

        const CAP_EXEMPT_REASON_MAP = {
          "Institution of Higher Education": "HIGHER_ED_INSTITUTION",
          "Affiliated Nonprofit": "NONPROFIT_AFFILIATED",
          "Nonprofit or Govt Research Org": "NONPROFIT_RESEARCH",
          "Working At Cap-Exempt Org": "EMPLOYED_AT_EXEMPT_ENTITY",
          "Concurrent Employment at Exempt Org": "CONCURRENT_CAP_EXEMPT",
          "J-1 Waiver Physician": "J1_PHYSICIAN_WAIVER",
          "Previously Counted/Extension/Amendment (AC21)":
            "PREV_COUNTED_OR_AC21",
          "Guam-CNMI Exemption": "GUAM_CNMI_EXEMPTION",
        };

        const petitionType = rowData["TYPE OF H-1B"];
        const exemptionReasonKey = rowData["CAP EXEMPTION REASON"];

        const numericalLimitationFields = [
          {
            nameOrId:
              "h1b1DataCollection.numericalLimitationInformation.typeOfH1BPetition",
            value: H1B_TYPE_MAP[petitionType],
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(numericalLimitationFields);

        // If cap exempt, select checkbox reason
        if (petitionType === "Cap Exempt" && exemptionReasonKey) {
          const reasonLabel = CAP_EXEMPT_REASON_MAP[exemptionReasonKey];
          await formFiller.delay(10000);
          await formFiller.selectCheckbox(
            "h1b1DataCollection.numericalLimitationInformation.capExemptReasons",
            reasonLabel,
            "id"
          );
        }

        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("h1-b numerical limitation information closed");
      }

      // Off-Site Assignment
      if (
        window.location.pathname.includes(
          "h-1b-and-h-1b1-data-collection-and-filling-fee-expemption-supplement/off-site-assignment"
        )
      ) {
        await formFiller.delay(10000);
        console.log("h1-b off-site assignment started");

        const offSiteAssignmentFields = [
          {
            nameOrId:
              "h1b1DataCollection.offsiteAssignment.beneficiaryAssignedToWorkOffsite",
            value: rowData["Work Off -Site"] === "Yes" ? "true" : "false",
            attr: "name",
            type: "radio",
          },
        ];

        const res = await formFiller.fillFieldsBatch(offSiteAssignmentFields);
        await formFiller.delay(1000);
        if (res) await formFiller.clickButtonById("button-button");
        console.log("h1-b off-site assignment closed");
      }
    })();

    return true;
  });
})();
