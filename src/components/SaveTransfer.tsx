import { useState } from 'react';
import { exportSave, importSave } from '../engine/save';
import type { SaveData } from '../engine/types';

/** Copy a save code out, or paste one in. Progress lives in this browser only, so this is how it moves. */
export function SaveTransfer({ save, onImport }: { save: SaveData; onImport: (s: SaveData) => void }) {
  const [mode, setMode] = useState<'closed' | 'export' | 'import'>('closed');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const code = exportSave(save);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMsg('Copied. Paste it wherever you want to keep it.');
    } catch {
      setMsg('Copy blocked by the browser. Select the code and copy it by hand.');
    }
  }

  function load() {
    try {
      const next = importSave(text);
      if (!window.confirm(`Replace your current progress (${save.xp} XP) with this save (${next.xp} XP)?`)) return;
      onImport(next);
      setMsg(`Imported. You're at ${next.xp.toLocaleString()} XP.`);
      setText('');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <footer className="footer">
      <span>Progress is saved in this browser.</span>
      <span className="row" style={{ gap: 14 }}>
        <button className="link" onClick={() => { setMode(mode === 'export' ? 'closed' : 'export'); setMsg(''); }}>Back up progress</button>
        <button className="link" onClick={() => { setMode(mode === 'import' ? 'closed' : 'import'); setMsg(''); }}>Restore progress</button>
      </span>
      {mode !== 'closed' && (
        <div className="transfer" style={{ flexBasis: '100%' }}>
          {mode === 'export' ? (
            <>
              <label htmlFor="save-out">Your save code. Keep it somewhere safe, or paste it into another browser.</label>
              <textarea id="save-out" readOnly value={code} onFocus={e => e.currentTarget.select()} />
              <div className="row"><button className="btn" onClick={copy}>Copy code</button></div>
            </>
          ) : (
            <>
              <label htmlFor="save-in">Paste a save code (it starts with EL1.)</label>
              <textarea id="save-in" value={text} onChange={e => setText(e.target.value)} />
              <div className="row"><button className="btn" disabled={!text.trim()} onClick={load}>Restore</button></div>
            </>
          )}
          {msg && <p className="hint" style={{ margin: 0 }} role="status">{msg}</p>}
        </div>
      )}
    </footer>
  );
}
