import React, { useRef, useState } from 'react';
import { API_BASE_URL } from '../../config';

const BASE = API_BASE_URL;

const UploadExcel = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx')) {
            setError('Please select a valid .xlsx file.');
            return;
        }

        setError(null);
        setResult(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${BASE}/expenses/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setResult({
                    message: data.message,
                    rows_imported: data.rows_imported,
                    import_mode: data.import_mode,
                    folder_name: data.folder_name,
                    folder_id: data.folder_id,
                    last_balance: data.last_balance,
                });
                onUploadSuccess();
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const detail = data.detail;
                setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Upload failed');
            }
        } catch {
            setError('Network error during upload');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-excel-wrap">
            <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                </svg>
                {isUploading ? 'Uploading…' : 'Import Excel'}
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                className="upload-excel-input-hidden"
            />

            <details className="upload-help-details">
                <summary>
                    Supported formats
                </summary>
                <div className="upload-help-body">
                    <p>
                        <strong>Classic:</strong> columns <code>Date</code>, <code>Amount</code>,{' '}
                        <code>Category</code> — optional <code>Type</code>, <code>Description</code> /{' '}
                        <code>Notes</code>. If <code>Type</code> is missing, sign is used: negative amount =
                        expense, positive = income.
                    </p>
                    <p>
                        <strong>Bank / YONO-style:</strong> <code>Date</code>, <code>Debit</code> and/or{' '}
                        <code>Credit</code>, optional <code>Narration</code> or <code>Description</code> /{' '}
                        <code>Particulars</code>. Optional <code>Balance</code> — last non-empty value is
                        returned after import for reconciliation.
                    </p>
                </div>
            </details>

            {error && <div className="upload-excel-error">{error}</div>}

            {result && (
                <div className="glass-panel upload-result-panel" role="status">
                    <p className="upload-result-title">Import complete</p>
                    <ul className="upload-result-list">
                        <li>
                            <strong>{result.rows_imported}</strong> row(s) → folder <strong>{result.folder_name}</strong>{' '}
                            (id {result.folder_id})
                        </li>
                        <li>
                            Mode: <strong>{result.import_mode}</strong>
                        </li>
                        {result.last_balance !== null && result.last_balance !== undefined && (
                            <li>
                                Last balance in sheet: <strong>Rs.{Number(result.last_balance).toFixed(2)}</strong>
                            </li>
                        )}
                    </ul>
                    <p className="upload-result-hint">
                        Compare this with <strong>Settings → Reconciliation</strong> if totals don’t match your
                        bank app.
                    </p>
                </div>
            )}
        </div>
    );
};

export default UploadExcel;
