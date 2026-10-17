import { ok, done } from './harness.ts';
import { act, Activity, useEffect, useEffectEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: any) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// useEffectEvent: theme change does not reconnect, toast sees latest theme
{ const log: string[] = []; let setTheme!: (t: string) => void; let fire!: () => void;
  function Chat({ roomId, theme }: { roomId: string; theme: string }) {
    const onConnected = useEffectEvent(() => log.push('toast ' + theme));
    useEffect(() => { log.push('connect ' + roomId); fire = () => onConnected(); return () => log.push('disconnect ' + roomId); }, [roomId]);
    return null; }
  function App() { const [t, s] = useState('light'); setTheme = s; return <Chat roomId="general" theme={t} />; }
  await mount(<App />); await act(async () => setTheme('dark')); fire();
  console.log('  ', log.join(' > ')); ok(log.join('|') === 'connect general|toast dark', 'useEffectEvent: no reconnect, latest theme'); }
// Activity hidden: state kept, effects cleaned, display none
{ const log: string[] = []; let setMode!: (m: 'visible' | 'hidden') => void; let inc!: () => void;
  function Tab() { const [n, s] = useState(0); inc = () => s(x => x + 1); useEffect(() => { log.push('setup'); return () => log.push('cleanup'); }, []); return <p id="tab">{n}</p>; }
  function App() { const [m, s] = useState<'visible' | 'hidden'>('visible'); setMode = s; return <Activity mode={m}><Tab /></Activity>; }
  const { host } = await mount(<App />); await act(async () => inc()); await act(async () => setMode('hidden'));
  const p = host.querySelector('#tab') as HTMLElement; console.log('   hidden style:', p?.style.display, 'text', p?.textContent, 'log', log.join(','));
  const hiddenOk = p && p.style.display === 'none' && log.join(',') === 'setup,cleanup';
  await act(async () => setMode('visible')); ok(hiddenOk && host.textContent === '1' && log.join(',') === 'setup,cleanup,setup', 'Activity: hidden keeps state, cleans effects, hides with display none; visible re-runs'); }
done();
