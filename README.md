📂 Document Analysis & Metadata UI
A high-performance React file upload interface designed for deep metadata extraction. This UI doesn't just "upload" files—it analyzes them in the browser to provide real-time metrics for documents, spreadsheets, and directories.

🛠 Features
1. Multi-Engine Extraction
The UI uses specialized libraries to peek into files before they are sent to the server:

PDF (.pdf): Uses pdfjs-dist and Y-coordinate grouping to calculate human-readable line counts rather than raw text chunks.

Word (.docx): Integrates mammoth.js for XML-to-text conversion to determine total line numbers.

Spreadsheets (.xlsx): Leverages SheetJS to map the active grid range, returning precise Row × Column dimensions.


2. Folder Intelligence
Batch Processing: Handles full directory uploads via webkitdirectory.

Recursive Metadata: Automatically calculates the total number of files within an uploaded folder and summarizes the aggregate file size.


🚀 Installation
Install the core dependencies:

Bash
npm install mammoth pdfjs-dist xlsx lucide-react
💻 Technical Implementation
PDF Worker
To ensure the PDF parser works correctly in modern build tools like Vite, the worker is configured via a URL constructor:

