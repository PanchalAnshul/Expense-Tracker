import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, FolderOpen, Trash2, Pencil, Check, X } from 'lucide-react';
import { folderService } from '../services/folderService';
import { useHeaderSearch } from '../context/SearchContext';

const Folders = () => {
    const [folders, setFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [savingId, setSavingId] = useState(null);
    const navigate = useNavigate();
    const { searchQuery } = useHeaderSearch();

    const fetchFolders = async () => {
        try {
            const data = await folderService.getAll();
            setFolders(data);
        } catch {
            console.error('Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    const filteredFolders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return folders;
        return folders.filter((f) => f.name.toLowerCase().includes(q));
    }, [folders, searchQuery]);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await folderService.create(newFolderName.trim());
            setNewFolderName('');
            setIsCreating(false);
            fetchFolders();
        } catch {
            console.error('Error creating folder');
        }
    };

    const handleDeleteFolder = async (folderId, name) => {
        if (
            !window.confirm(
                `Delete folder "${name}"? The folder is removed; transactions stay in the database.`
            )
        ) {
            return;
        }

        try {
            await folderService.delete(folderId);
            fetchFolders();
        } catch {
            console.error('Error deleting folder');
        }
    };

    const startRename = (f) => {
        setEditingId(f.id);
        setEditName(f.name);
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveRename = async (folderId) => {
        const name = editName.trim();
        if (!name) return;
        setSavingId(folderId);
        try {
            await folderService.update(folderId, name);
            setEditingId(null);
            setEditName('');
            fetchFolders();
        } catch {
            console.error('Error renaming folder');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Folders</h1>
                    <p className="page-subtitle">
                        Group trips and shared expenses. Use the top search to filter this list by name.
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <FolderPlus size={16} /> New folder
                </button>
            </header>

            {isCreating && (
                <div className="glass-panel folder-create-panel">
                    <form onSubmit={handleCreateFolder} className="folder-create-form">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Trip to Bali, office lunch"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>
                            Create
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="page-loading muted">
                    <div className="loading-spinner" />
                    <p>Loading folders…</p>
                </div>
            ) : folders.length === 0 ? (
                <div className="glass-panel empty-state">
                    <FolderOpen size={48} className="empty-state-icon" />
                    <p className="empty-state-title">No folders yet</p>
                    <p className="empty-state-text">Create a folder to organize expenses, then open it to add records.</p>
                </div>
            ) : filteredFolders.length === 0 ? (
                <div className="glass-panel empty-state">
                    <p className="empty-state-text">No folders match “{searchQuery}”. Try another search.</p>
                </div>
            ) : (
                <div className="folder-grid">
                    {filteredFolders.map((folder) => (
                        <div
                            key={folder.id}
                            className="glass-panel folder-card"
                            onClick={() => editingId !== folder.id && navigate(`/folders/${folder.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingId !== folder.id) navigate(`/folders/${folder.id}`);
                            }}
                        >
                            <div className="folder-card-top">
                                <div className="folder-card-icon-wrap">
                                    <FolderOpen size={22} className="folder-card-icon" />
                                </div>
                                <div className="folder-card-main">
                                    {editingId === folder.id ? (
                                        <div
                                            className="folder-rename-row"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                className="input-field folder-rename-input"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveRename(folder.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn-icon folder-rename-btn"
                                                title="Save name"
                                                onClick={() => saveRename(folder.id)}
                                                disabled={savingId === folder.id}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-icon folder-rename-btn"
                                                title="Cancel"
                                                onClick={cancelRename}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="folder-card-title">{folder.name}</h3>
                                    )}
                                    <p className="folder-card-meta">Expense collection</p>
                                </div>
                                <div className="folder-card-actions" onClick={(e) => e.stopPropagation()}>
                                    {editingId !== folder.id && (
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            title="Rename folder"
                                            onClick={() => startRename(folder)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        title="Delete folder"
                                        onClick={() => handleDeleteFolder(folder.id, folder.name)}
                                    >
                                        <Trash2 size={16} className="icon-danger" />
                                    </button>
                                </div>
                            </div>

                            <div className="folder-card-footer">
                                <span className="folder-card-label">Net balance</span>
                                <span
                                    className="folder-card-balance"
                                    style={{
                                        color: folder.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                                    }}
                                >
                                    Rs.{Math.abs(folder.balance)?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Folders;
