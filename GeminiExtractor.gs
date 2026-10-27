/**
 * Autonomous Legal & Medical PDF Extractor using Gemini 1.5 Flash API
 * Populates a Star Schema Data Model for Labor Litigation BI
 */

function getEnvConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    GEMINI_API_KEY: props.getProperty('GEMINI_API_KEY') || 'YOUR_GEMINI_API_KEY_HERE',
    REPORTS_FOLDER_ID: props.getProperty('REPORTS_FOLDER_ID') || 'YOUR_DRIVE_FOLDER_ID_HERE'
  };
}

function processPendingExpertReports() {
  const config = getEnvConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const factSheet = ss.getSheetByName('Fact_Pericias') || ss.insertSheet('Fact_Pericias');

  if (factSheet.getLastRow() === 0) {
    factSheet.appendRow([
      'Report_ID', 'Process_Number', 'Sector_ID', 'Expert_Name',
      'Hazard_Agent', 'ICD_Code', 'Anatomical_Group', 'Conclusion', 'Processed_At'
    ]);
  }

  const folder = DriveApp.getFolderById(config.REPORTS_FOLDER_ID);
  const files = folder.getFilesByType(MimeType.PDF);

  while (files.hasNext()) {
    const file = files.next();
    if (file.getDescription() === 'PROCESSED_BY_AI') continue;

    try {
      const extractedData = extractPdfWithGemini_(file, config.GEMINI_API_KEY);
      if (extractedData) {
        factSheet.appendRow([
          file.getId(),
          extractedData.process_number || 'N/A',
          extractedData.sector || 'N/A',
          extractedData.expert_name || 'N/A',
          extractedData.hazard_agent || 'N/A',
          extractedData.icd_code || 'N/A',
          extractedData.anatomical_group || 'N/A',
          extractedData.conclusion || 'N/A',
          new Date()
        ]);
        file.setDescription('PROCESSED_BY_AI');
      }
    } catch (e) {
      Logger.log(`Error processing file ${file.getName()}: ${e.message}`);
    }
  }
}

function extractPdfWithGemini_(pdfFile, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const base64Pdf = Utilities.base64Encode(pdfFile.getBlob().getBytes());

  const systemPrompt = `You are a Legal Engineering AI specialized in Brazilian Labor Litigation and Occupational Medicine.
Extract the following fields from the attached expert report (laudo pericial) or medical certificate and return ONLY a valid JSON object:
- "process_number": CNJ lawsuit number (string)
- "sector": Manufacturing sector or cost center mentioned (string)
- "expert_name": Name of the court-appointed expert / perito (string)
- "hazard_agent": Insalubrity or ergonomics risk agent evaluated, e.g., Noise, Heat, Ergonomics, Chemical (string)
- "icd_code": Primary ICD-10 / CID-10 medical code mentioned (string)
- "anatomical_group": Classify the CID into "Upper Limbs (Membros Superiores)", "Lower Limbs (Membros Inferiores)", "Spine (Coluna)", or "Other" (string)
- "conclusion": "Favorable to Company" or "Unfavorable / Causal Link Found" (string)`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { inline_data: { mime_type: 'application/pdf', data: base64Pdf } }
      ]
    }],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1
    }
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const json = JSON.parse(response.getContentText());
  if (json.candidates && json.candidates[0].content.parts[0].text) {
    return JSON.parse(json.candidates[0].content.parts[0].text);
  }
  return null;
}
