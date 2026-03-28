import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { settingsService } from '../../services/settingsService';

const SettingsPage = () => {
    const { theme, setThemeMode } = useTheme();
    const [opening, setOpening] = useState('');
    const [expected, setExpected] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const s = await settingsService.get();
                if (!cancelled) {
                    setOpening(
                        s.opening_balance !== null && s.opening_balance !== undefined
                            ? String(s.opening_balance)
                            : ''
                    );
                    setExpected(
                        s.expected_closing_balance !== null && s.expected_closing_balance !== undefined
                            ? String(s.expected_closing_balance)
                            : ''
                    );
                }
            } catch {
                if (!cancelled) setMessage('Could not load settings.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSaveReconciliation = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const payload = {};
            const o = opening.trim();
            const ex = expected.trim();
            payload.opening_balance = o === '' ? null : parseFloat(o);
            payload.expected_closing_balance = ex === '' ? null : parseFloat(ex);
            if (
                payload.opening_balance !== null &&
                (Number.isNaN(payload.opening_balance) || payload.opening_balance === undefined)
            ) {
                setMessage('Opening balance must be a number.');
                setSaving(false);
                return;
            }
            if (
                payload.expected_closing_balance !== null &&
                (Number.isNaN(payload.expected_closing_balance) ||
                    payload.expected_closing_balance === undefined)
            ) {
                setMessage('Expected closing must be a number.');
                setSaving(false);
                return;
            }
            await settingsService.update(payload);
            setMessage('Saved.');
        } catch {
            setMessage('Save failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <section className="page-hero">
                <div>
                    <p className="page-eyebrow">Preferences</p>
                    <h1>Settings</h1>
                    <p className="page-hero-copy">
                        Theme, reconciliation, and how balances relate to your bank statement.
                    </p>
                </div>
            </section>

            <div className="transaction-groups">
                <section className="panel-section">
                    <div className="panel-header">
                        <div>
                            <h2>Appearance</h2>
                            <p>Applies across the app (same as the header toggle).</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            className={theme === 'light' ? 'btn btn-gradient' : 'btn btn-outline'}
                            onClick={() => setThemeMode('light')}
                        >
                            Light
                        </button>
                        <button
                            type="button"
                            className={theme === 'dark' ? 'btn btn-gradient' : 'btn btn-outline'}
                            onClick={() => setThemeMode('dark')}
                        >
                            Dark
                        </button>
                    </div>
                </section>

                <section className="panel-section">
                    <div className="panel-header">
                        <div>
                            <h2>Reconciliation (bank)</h2>
                            <p>The app’s <strong>net flow</strong> is total income minus total expenses from imported rows. Your <strong>statement closing balance</strong> equals opening balance plus net flow over the same period.</p>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '800px' }}>
                        If the period doesn’t start at zero, enter the opening balance from the statement; then <strong>adjusted = opening + net flow</strong> should match YONO’s closing. Optionally set <strong>expected closing</strong> to the last balance shown in the app (e.g. 4597.90) to see variance.
                    </p>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
                    ) : (
                        <form className="transaction-modal-form" onSubmit={handleSaveReconciliation} style={{ maxWidth: '480px' }}>
                            <div className="modal-field">
                                <span className="modal-field-label">Opening balance (optional)</span>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 1000.00"
                                    value={opening}
                                    onChange={(e) => setOpening(e.target.value)}
                                />
                            </div>
                            <div className="modal-field">
                                <span className="modal-field-label">Expected closing balance (optional)</span>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 4597.90"
                                    value={expected}
                                    onChange={(e) => setExpected(e.target.value)}
                                />
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <button type="submit" className="btn btn-gradient" disabled={saving}>
                                    {saving ? 'Saving…' : 'Save reconciliation'}
                                </button>
                            </div>
                            {message && <p style={{ marginTop: '8px', color: 'var(--income-green)' }}>{message}</p>}
                        </form>
                    )}
                </section>

                <section className="panel-section">
                    <div className="panel-header">
                        <div>
                            <h2>Data</h2>
                            <p>Data is stored in the local SQLite database under the backend. Back up the backend folder to export your data.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
