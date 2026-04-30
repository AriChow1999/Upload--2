📂 Document Analysis & Metadata UI
A high-performance React file upload interface designed for deep metadata extraction. This UI doesn't just "upload" files—it analyzes them in the browser to provide real-time metrics for documents, spreadsheets, and directories.

🛠 Features
Multi-Engine Extraction
The UI uses specialized libraries to peek into files before they are sent to the server:

PDF (.pdf): Uses pdfjs-dist and Y-coordinate grouping to calculate human-readable line counts rather than raw text chunks.

Word (.docx): Integrates mammoth.js for XML-to-text conversion to determine total line numbers.

Spreadsheets (.xlsx): Leverages SheetJS to map the active grid range, returning precise Row × Column dimensions.

Folder Intelligence
Batch Processing: Handles full directory uploads via webkitdirectory.

Recursive Metadata: Automatically calculates the total number of files within an uploaded folder and summarizes the aggregate file size.

🚀 Installation
Install the core dependencies via npm:

Bash
npm install mammoth pdfjs-dist xlsx lucide-react
