# 🤖 Generative AI & BI Platform for Medical/Expert Reports (Gemini 1.5 Flash)

## 🎯 Business Problem
In labor litigation (workplace hazard and occupational disease claims), technical expert reports (*laudos periciais*) and medical certificates are stored as unstructured PDFs. Manually reading hundreds of pages to cross-reference ICD codes (*CIDs*), hazardous agents, and manufacturing sectors makes root-cause prevention slow and reactive.

## 💡 Technical Solution & Architecture
An autonomous Business Intelligence pipeline integrating **Google Workspace** and **Generative AI (Gemini 1.5 Flash API)** to automatically parse unstructured PDF documents, extract structured entities, and feed a relational **Star Schema** data model connected to an interactive web dashboard.

### 🛠️ Tech Stack
* **AI & Extraction Engine:** Gemini 1.5 Flash API (Multimodal PDF parsing via REST API) + Google Apps Script (V8).
* **Data Modeling (Database):** Google Sheets structured as a Relational **Star Schema** (`Fact_Reports`, `Dim_Sectors`, `Dim_ICD_Anatomical`, `Dim_Experts`).
* **Frontend & Visualization:** HTML5, Tailwind CSS, and **Chart.js** for real-time reactive filtering.
* **Security Best Practices:** API Keys and Folder IDs are strictly managed via environment properties (`PropertiesService`), ensuring zero hardcoded credentials.

## 📂 Repository Structure
* `GeminiExtractor.gs` — Serverless AI pipeline that reads PDFs from Google Drive, sends base64 payloads to Gemini 1.5 Flash with a strict JSON schema prompt, and populates the Star Schema tables.
