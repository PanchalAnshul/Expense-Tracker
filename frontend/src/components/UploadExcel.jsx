import React, { useRef, useState } from 'react';

const UploadExcel = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx')) {
            setError('Please select a valid .xlsx file.');
            return;
        }

        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/expenses/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                onUploadSuccess();
                fileInputRef.current.value = ''; // Reset
            } else {
                const data = await response.json();
                setError(data.detail || 'Upload failed');
            }
        } catch (err) {
            setError('Network error during upload');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                {isUploading ? 'Uploading...' : 'Import Data'}
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                style={{ display: 'none' }}
            />

            {error && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default UploadExcel;
