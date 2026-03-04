import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, FolderOpen, Trash2 } from 'lucide-react';
import { folderService } from '../services/folderService';

const Folders = () => {
    const [folders, setFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchFolders = async () => {
        try {
            const data = await folderService.getAll();
            setFolders(data);
        } catch (error) {
            console.error("Failed to load folders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await folderService.create(newFolderName.trim());
            setNewFolderName('');
            setIsCreating(false);
            fetchFolders();
        } catch (e) {
            console.error("Error creating folder");
        }
    };

    const handleDeleteFolder = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete folder "${name}" ? This removes the folder but keeps expenses globally visible.`)) return;

        try {
            await folderService.delete(id);
            fetchFolders();
        } catch (e) { console.error("Error deleting folder"); }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Folders</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.875rem' }}>Organize shared expenses and trips.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <FolderPlus size={16} /> New Folder
                </button>
            </header>

            {isCreating && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="E.g., Trip to Bali, Office Lunch"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>Create</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading folders...</div>
            ) : folders.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    <FolderOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto', display: 'block' }} />
                    <p>No folders created yet. Group your expenses by creating one!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            className="glass-panel"
                            onClick={() => navigate(`/folders/${folder.id}`)}
                            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s ease, border-color 0.15s ease', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FolderOpen size={20} color="var(--accent-color)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{folder.name}</h3>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Expenses collection</p>
                                    </div>
                                </div>
                                <button
                                    className="btn-icon"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                                    title="Delete Folder"
                                    style={{ opacity: 0.6 }}
                                >
                                    <Trash2 size={16} color="var(--danger-color)" />
                                </button>
                            </div>

                            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 500 }}>Net Balance</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: folder.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
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
