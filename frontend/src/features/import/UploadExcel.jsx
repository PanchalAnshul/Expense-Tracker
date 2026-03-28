import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CloudUpload, FileSpreadsheet, LoaderCircle, TriangleAlert, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { expenseService } from '../../services/expenseService';
import { useToast } from '../../context/ToastContext';

const formatPreviewDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const supportedSchema = [
  'Date',
  'Type',
  'Amount',
  'Category',
  'Notes',
  'Payment_Mode',
  'Balance',
];

const UploadExcel = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isImporting) {
      setProgress(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : current + 8));
    }, 180);

    return () => window.clearInterval(interval);
  }, [isImporting]);

  const progressCount = useMemo(() => {
    if (!preview?.transactions_found) return 0;
    const count = Math.round((preview.transactions_found * Math.max(progress, 8)) / 100);
    return Math.min(preview.transactions_found, Math.max(1, count));
  }, [preview, progress]);

  const resetSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    setShowPreview(false);
    setShowDuplicatePrompt(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelection = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Only .xlsx files are allowed.');
      return;
    }

    setSelectedFile(file);
    setError('');
    setIsPreviewing(true);

    try {
      const previewData = await expenseService.previewImport(file);
      setPreview(previewData);
      setShowPreview(true);
    } catch (previewError) {
      setError(previewError.message || 'Failed to read the Excel file.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const startImport = async (duplicateAction = 'cancel') => {
    if (!selectedFile || !preview) return;

    if (preview.duplicate_exists && duplicateAction === 'cancel') {
      setShowDuplicatePrompt(true);
      return;
    }

    setError('');
    setShowDuplicatePrompt(false);
    setIsImporting(true);

    try {
      const result = await expenseService.importExcel(selectedFile, duplicateAction);
      setProgress(100);
      onUploadSuccess?.();
      toast.success(`✓ Imported ${result.rows_imported} transactions into ${result.folder_name}`);
      navigate(`/folders/${result.folder_id}`, {
        state: {
          importSummary: {
            folderName: result.folder_name,
            rowsImported: result.rows_imported,
            warnings: result.warnings || [],
          },
        },
      });
      resetSelection();
    } catch (importError) {
      if (importError.status === 409) {
        setShowDuplicatePrompt(true);
      } else {
        setError(importError.message || 'Import failed.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="dashboard-import">
        <button
          type="button"
          className="btn btn-outline dashboard-import-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPreviewing || isImporting}
        >
          {isPreviewing || isImporting ? <LoaderCircle size={16} className="spin-icon" /> : <Upload size={16} />}
          Import Excel
        </button>
        <button
          type="button"
          className="dashboard-import-link"
          onClick={() => setShowSchema(true)}
        >
          Supported formats
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="upload-excel-input-hidden"
          onChange={(event) => handleFileSelection(event.target.files?.[0])}
        />
        {error ? <p className="dashboard-import-error">{error}</p> : null}
      </div>

      {showSchema ? (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && setShowSchema(false)}>
          <div className="transaction-modal import-modal">
            <button type="button" className="modal-close" onClick={() => setShowSchema(false)} aria-label="Close modal">
              ×
            </button>
            <div className="import-modal-header">
              <span className="modal-eyebrow">Supported formats</span>
              <h2>Excel schema for SBI CashBook imports</h2>
            </div>
            <div className="import-schema-card">
              <div className="import-schema-row import-schema-head">
                <span>Column</span>
                <span>Expected field</span>
              </div>
              {supportedSchema.map((field, index) => (
                <div key={field} className="import-schema-row">
                  <span>{String.fromCharCode(65 + index)}</span>
                  <span>{field}</span>
                </div>
              ))}
            </div>
            <p className="import-helper-copy">
              Source sheet must be <strong>All Transactions</strong>. Row 1 must be the header row and all later rows are imported.
            </p>
          </div>
        </div>
      ) : null}

      {showPreview && preview ? (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && !isImporting && resetSelection()}>
          <div className="transaction-modal import-modal">
            <button
              type="button"
              className="modal-close"
              onClick={resetSelection}
              aria-label="Close modal"
              disabled={isImporting}
            >
              ×
            </button>

            {!isImporting ? (
              <>
                <div className="import-modal-header">
                  <span className="modal-eyebrow">Import preview</span>
                  <h2>Import Preview</h2>
                </div>

                <div className="import-preview-grid">
                  <div className="import-preview-card">
                    <span>File</span>
                    <strong>{preview.file_name}</strong>
                  </div>
                  <div className="import-preview-card">
                    <span>Sheet</span>
                    <strong>{preview.sheet_name}</strong>
                  </div>
                  <div className="import-preview-card">
                    <span>Transactions found</span>
                    <strong>{preview.transactions_found.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="import-preview-card">
                    <span>New folder will be created</span>
                    <strong>{preview.duplicate_exists ? preview.suggested_folder_name : preview.proposed_folder_name}</strong>
                  </div>
                </div>

                <div className="import-preview-summary">
                  <p>
                    Date range: <strong>{formatPreviewDate(preview.date_range_start)}</strong> to{' '}
                    <strong>{formatPreviewDate(preview.date_range_end)}</strong>
                  </p>
                  <p>
                    Credits: <strong>{preview.credits_count}</strong> | Debits: <strong>{preview.debits_count}</strong>
                  </p>
                </div>

                {preview.file_size_warning ? (
                  <div className="import-warning-banner">
                    <TriangleAlert size={16} />
                    <span>File is larger than 10MB. Import is allowed, but it may take longer.</span>
                  </div>
                ) : null}

                {preview.duplicate_exists ? (
                  <div className="import-warning-banner info">
                    <CircleAlert size={16} />
                    <span>Folder '{preview.proposed_folder_name}' already exists.</span>
                  </div>
                ) : null}

                {showDuplicatePrompt ? (
                  <div className="duplicate-choice-card">
                    <p>Folder '{preview.proposed_folder_name}' already exists.</p>
                    <div className="duplicate-choice-actions">
                      <button type="button" className="btn btn-outline" onClick={() => startImport('overwrite')}>
                        Overwrite
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => startImport('create_new')}>
                        Create new
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setShowDuplicatePrompt(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="import-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={resetSelection}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-gradient" onClick={() => startImport()}>
                    <CloudUpload size={16} />
                    Import All
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="import-modal-header">
                  <span className="modal-eyebrow">Importing</span>
                  <h2>Importing transactions</h2>
                </div>
                <div className="import-progress-card">
                  <div className="import-progress-head">
                    <FileSpreadsheet size={18} />
                    <strong>
                      Importing {progressCount} of {preview.transactions_found.toLocaleString('en-IN')} transactions...
                    </strong>
                  </div>
                  <div className="import-progress-track">
                    <div className="import-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UploadExcel;
