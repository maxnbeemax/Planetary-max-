import React, { useId, useRef, useState } from 'react';

type Line = { kind: 'command' | 'output' | 'error'; text: string };
const initial: Line[] = [{kind:'output',text:'PORTAL-OS1 command interface initialized.'},{kind:'output',text:'Type “help” to explore available commands.'}];
const routes: Record<string,string> = { status: '/api/status', 'd1 art list':'/api/artworks', 'd1 chess list':'/api/chess/games', 'd1 sports list':'/api/telemetry' };
export default function SovereignCommandTerminal({ compact = false }: { compact?: boolean } = {}) {
  const inputId = useId();
  const [lines,setLines]=useState<Line[]>(initial); const [input,setInput]=useState(''); const [busy,setBusy]=useState(false); const inputRef=useRef<HTMLInputElement>(null);
  const run = async (event:React.FormEvent) => {
    event.preventDefault(); const command=input.trim(); if(!command || busy) return; setInput('');
    if(command.toLowerCase()==='clear'){setLines([]);return;}
    setLines(previous=>[...previous,{kind:'command',text:command}]);
    const key=command.toLowerCase().replace(/\s+/g,' ');
    if(key==='help') { setLines(previous=>[...previous,{kind:'output',text:'help · clear · status · d1 art list · d1 chess list · d1 sports list · node status · catalog · escrow · or ask BEEMAX a question'}]); return; }
    setBusy(true);
    try { const naturalLanguage = !routes[key]; const response=await fetch(naturalLanguage ? '/api/beemax/chat' : routes[key], naturalLanguage ? {method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({prompt:command})} : {headers:{Accept:'application/json'}}); const contentType=response.headers.get('content-type') || ''; if(!contentType.includes('application/json')) throw new Error(`Worker returned a non-JSON response (HTTP ${response.status}).`); const data=await response.json(); setLines(previous=>[...previous,{kind:response.ok?'output':'error',text:naturalLanguage ? (response.ok ? data.response : data.message || `HTTP ${response.status}`) : `HTTP ${response.status} ${JSON.stringify(data)}`}]); }
    catch(error) { setLines(previous=>[...previous,{kind:'error',text:`Worker request failed: ${error instanceof Error ? error.message : 'Unknown error'}`}]); }
    finally {setBusy(false); inputRef.current?.focus();}
  };
  return <div className={`terminal-body${compact ? ' terminal-compact' : ''}`}><div className="terminal-output" role="log" aria-live="polite">{lines.map((line,i)=><div className={`terminal-line ${line.kind}`} key={i}>{line.kind==='command'&&<span>portal@sovereign:~$ </span>}{line.text}</div>)}</div><form className="terminal-input" onSubmit={run}><label htmlFor={inputId}>portal@sovereign:~$</label><input id={inputId} ref={inputRef} value={input} onChange={event=>setInput(event.target.value)} placeholder={busy?'Running command…':'Enter a command or question...'} maxLength={2000} disabled={busy} autoComplete="off" spellCheck={false}/><button type="submit" disabled={busy}>RUN ↗</button></form><div className="terminal-hint"><span>TRY: <button onClick={()=>setInput('help')}>help</button> <button onClick={()=>setInput('status')}>status</button> <button onClick={()=>setInput('catalog')}>catalog</button></span><span>AI INTERACTIONS HASHED</span></div></div>;
}
