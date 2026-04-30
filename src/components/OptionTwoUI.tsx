/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
    X, Wand2, Plus, Folder,
    FileText, Table, Image as ImageIcon,
    Video, Music, Archive, Code
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import selectionIcon from '../assets/iconmonstr-selection-17.svg';
import './OptionTwoUI.css';

const workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type FileCategory = 'document' | 'spreadsheet' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'folder';

interface UploadItem {
    id: string;
    name: string;
    type: FileCategory;
    lines?: number;
    size?: number;
    rows?: number;
    columns?: number;
    files?: number;
    ext?:string
}

const OptionTwoUI: React.FC = () => {
    const [items, setItems] = useState<UploadItem[]>([]);
    const [selectedModel, setSelectedModel] = useState('5.0');

    const getCategory = (fileName: string): FileCategory => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['pdf', 'docx', 'txt', 'md'].includes(ext || '')) return 'document';
        if (['xlsx', 'csv', 'json'].includes(ext || '')) return 'spreadsheet';
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return 'image';
        if (['mp4', 'mov'].includes(ext || '')) return 'video';
        if (['mp3', 'wav'].includes(ext || '')) return 'audio';
        if (['zip', 'rar', '7z'].includes(ext || '')) return 'archive';
        if (['py', 'js', 'tsx', 'ts', 'html', 'css', 'yaml'].includes(ext || '')) return 'code';
        return 'document';
    };



    const fetchLineCount = async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();

        try {
            if (ext === 'docx') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });

                return result.value.split('\n').filter(line => line.trim().length > 0).length;
            } else if (ext === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                let totalLines = 0;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    // Use a Set to store unique Y-coordinates (vertical positions)
                    const yCoordinates = new Set();

                    textContent.items.forEach((item: any) => {
                        // item.transform[5] is the Y-coordinate of the text block
                        if (item.str.trim().length > 0) {
                            yCoordinates.add(Math.round(item.transform[5]));
                        }
                    });

                    // The number of unique Y-coordinates is the number of lines
                    totalLines += yCoordinates.size;
                }
                return totalLines;
            }
        } catch (error) {
            console.error("Error reading file lines:", error);
        }
        return undefined;
    };

    const getExcelDimensions = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            if (!worksheet['!ref']) return { rows: 0, cols: 0 };

            const range = XLSX.utils.decode_range(worksheet['!ref']);
            let lastRow = -1;
            let lastCol = -1;

            // Iterate through the range to find the true boundaries of data
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = worksheet[cellAddress];

                    // If cell exists and has a value
                    if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                        if (R > lastRow) lastRow = R;
                        if (C > lastCol) lastCol = C;
                    }
                }
            }

            return {
                rows: lastRow === -1 ? 0 : lastRow + 1,
                cols: lastCol === -1 ? 0 : lastCol + 1
            };
        } catch (error) {
            console.error("Error reading Excel dimensions:", error);
            return { rows: 0, cols: 0 };
        }
    };


    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'file' | 'folder') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newItems: UploadItem[] = [];

        if (mode === 'folder') {
            const folderName = files[0].webkitRelativePath.split('/')[0] || "New Folder";
            newItems.push({ id: crypto.randomUUID(), name: folderName, type: 'folder', files: files.length,ext:"Folder" });
        } else {
            // Use for...of loop to allow awaiting async operations
            for (const f of Array.from(files)) {
                const ext = f.name.split('.').pop()?.toLowerCase();
                const category = getCategory(f.name);
                let lines = undefined;
                let rows = undefined;
                let columns = undefined;

                // Only fetch lines for docs
                if (category === 'document') {
                    lines = await fetchLineCount(f);
                }

                if (category === "spreadsheet") {
                    const dimensions = await getExcelDimensions(f);
                    rows = dimensions.rows;
                    columns = dimensions.cols;
                }

                newItems.push({
                    id: crypto.randomUUID(),
                    name: f.name,
                    type: category,
                    size: f.size,
                    lines: lines,
                    rows: rows,
                    columns: columns,
                    ext:ext
                });
            }
        }

        setItems(prev => [...prev, ...newItems]);
        e.target.value = '';
    };

    const renderIcon = (item: UploadItem) => {
        const iconSize = 14;
        switch (item.type) {
            case 'folder': return <Folder size={iconSize} className="icon-folder" />;
            case 'document': return <FileText size={iconSize} className="icon-doc" />;
            case 'spreadsheet': return <Table size={iconSize} className="icon-sheet" />;
            case 'image': return <ImageIcon size={iconSize} className="icon-image" />;
            case 'video': return <Video size={iconSize} className="icon-video" />;
            case 'audio': return <Music size={iconSize} className="icon-audio" />;
            case 'archive': return <Archive size={iconSize} className="icon-archive" />;
            case 'code': return <Code size={iconSize} className="icon-code" />;
            default: return <FileText size={iconSize} className="icon-doc" />;
        }
    };

    return (
        <div className="viewport-center">
            <div className="main-card">
                <div className="grey-input-wrapper">
                    {items.length > 0 && (
                        <div className="pills-scroll-container">
                            <div className="pills-inner-flex">
                                {items.map((item) => (
                                    <div key={item.id} className="file-detail-card">
                                        <button className="card-remove-btn" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                                            <X size={12} strokeWidth={3} />
                                        </button>

                                        <div className="card-text-content">
                                            <div className="card-filename">{item.name}</div>
                                            <div className="card-metadata">
                                                {item.size ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                                            </div>
                                            <div className="card-metadata">
                                                {item.lines ? `${item.lines} lines` : ""}
                                            </div>
                                            <div className="card-metadata">
                                                {item.rows ? `${item.rows} rows` : ""}
                                            </div>
                                            <div className="card-metadata">
                                                {item.columns ? `${item.columns} columns` : ""}
                                            </div>
                                            <div className="card-metadata">
                                                {item.files ? `${item.files} ${item.files == 1 ? "File" : "Files"}` : ""}
                                            </div>

                                        </div>

                                        <div className="card-type-tag">
                                            <div className="mini-icon-box">{renderIcon(item)}</div>
                                            <span className="type-label-text">{item.ext}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="white-inner-container">
                        <textarea placeholder="Add instructions from attached images..." />

                        <div className="bottom-actions">
                            <div className="actions-left">
                                <label htmlFor="file-up" className="util-btn bordered">
                                    <Plus size={18} />
                                </label>
                                <input id="file-up" type="file" multiple onChange={(e) => handleUpload(e, 'file')} style={{ display: 'none' }} />

                                <label htmlFor="folder-up" className="util-btn bordered">
                                    <Folder size={18} />
                                </label>

                                <input
                                    id="folder-up"
                                    type="file"
                                    onChange={(e) => handleUpload(e, 'folder')}
                                    style={{ display: 'none' }}
                                    {...({
                                        webkitdirectory: ""
                                    } as any)}
                                />

                                <button className="util-btn"><Wand2 size={18} /></button>
                                <button className="util-btn"><div className="mini-dashed-circle" /></button>
                                <button className="util-btn">
                                    <img src={selectionIcon} className="selection-svg" alt="Selection" />
                                </button>

                                <div className="gpt-selector-wrapper">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" className="gpt-mini-logo" alt="" />
                                    <select
                                        className="gpt-select-menu"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                    >
                                        <option value="5.0">GPT 5.0</option>
                                        <option value="5.1">GPT 5.1</option>
                                        <option value="5.2">GPT 5.2</option>
                                        <option value="5.3">GPT 5.3</option>
                                        <option value="5.4">GPT 5.4</option>
                                        <option value="5.5">GPT 5.5</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionTwoUI;
