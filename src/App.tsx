import React, { Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Overview } from './core/PortalOS1Layout';
import SystemTelemetryBar from './core/SystemTelemetryBar';
import ArtGalleryView from './modules/art/ArtGalleryView';
import ChessArenaView from './modules/chess/ChessArenaView';
import SportsPredictiveView from './modules/sports/SportsPredictiveView';
import BettorHudSimulator from './modules/sports/BettorHudSimulator';
import KinematicMotionFeed from './modules/sports/KinematicMotionFeed';
import SovereignCommandTerminal from './modules/admin/SovereignCommandTerminal';
import type { Workspace } from './shared/types';
import './ecosystem.css';

const AdminConsole = React.lazy(() => import('./modules/admin/PortalOS1Console'));
const spaces = [
  { path: '/storefront', label: 'Planetary-max', number: '01' },
  { path: '/chess', label: 'MAX Chess', number: '02' },
  { path: '/sports', label: 'MAX-SPORTS', number: '03' },
  { path: '/umbrella', label: 'OUR umbrella™', number: '04' },
  { path: '/beemax', label: 'BEEMAX HUD', number: '05' },
];

function OverviewRoute() {
  const navigate = useNavigate();
  const paths: Record<Workspace, string> = { overview: '/overview', art: '/storefront', chess: '/chess', sports: '/sports' };
  return <Overview open={space => navigate(paths[space])} />;
}

function SportsSpace() {
  return <div className="sports-space"><SportsPredictiveView /><div className="sports-explore"><KinematicMotionFeed /><BettorHudSimulator /></div></div>;
}

function UmbrellaSpace() {
  return <section className="umbrella-space">
    <div className="space-heading"><div><span className="space-kicker">04 / GOVERNANCE &amp; DESIGN</span><h1>Ideas under <em>one umbrella.</em></h1><p>A home for the principles, spaces, and systems that make up the MAX ecosystem.</p></div><span className="space-stamp">OUR<br />UMBRELLA™ <b>✳</b></span></div>
    <div className="umbrella-grid">
      <article><span>01 / DESIGN</span><h2>A shared language.</h2><p>Each space has its own purpose, connected through a common portal and a consistent visual identity.</p></article>
      <article><span>02 / GOVERNANCE</span><h2>Clear authority.</h2><p>Orders, signatures and releases follow the permissions and verified records defined by each service.</p></article>
      <article><span>03 / ARCHITECTURE</span><h2>Connected spaces.</h2><p>Explore art, chess and sports alongside the BEEMAX command interface from one place.</p></article>
    </div>
    <div className="umbrella-note"><span>✳</span><p>Design specification &amp; governance overview <small>Trademark and ownership records are not connected here.</small></p></div>
  </section>;
}

function BeemaxSpace() {
  return <section className="beemax-space"><div className="space-heading"><div><span className="space-kicker">05 / BEEMAX HUD</span><h1>A command center <em>for your universe.</em></h1><p>Ask about the catalog, node status or escrow, and explore the systems behind your spaces.</p></div><div className="beemax-orbit" aria-hidden="true"><span>✳</span></div></div>
    <div className="beemax-cards"><article><span>01 / COMMAND STREAM</span><h2>Ask BEEMAX</h2><p>Use the command stream below to ask questions or query the catalog and system status.</p><a href="#command-stream">Open command stream ↓</a></article><article><span>02 / CONTROL SURFACE</span><h2>Explore the console</h2><p>View the registry, sample network topology and command terminal.</p><a href="/admin">Open command center ↗</a></article></div>
    <p className="space-caption">Commands query available endpoints; AI responses do not authorize transactions.</p>
  </section>;
}

function NotFound() { return <section className="space-heading"><div><span className="space-kicker">SPACE NOT FOUND</span><h1>Find your <em>way back.</em></h1><p>This address does not match a workspace.</p><Link to="/">Go to the storefront ↗</Link></div></section>; }

export function Ecosystem() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('a.active');
    if (!nav || !active) return;
    const container = nav.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.right > container.right) nav.scrollLeft += item.right - container.right;
    else if (item.left < container.left) nav.scrollLeft -= container.left - item.left;
  }, [location.pathname, location.hash]);
  const legacyAdmin = location.pathname.replace(/\/$/, '') === '/admin' || location.hash === '#/admin' || location.hash.startsWith('#/admin/');
  useEffect(() => { if (!legacyAdmin) document.title = 'PORTAL-OS1 — Your creative universe'; }, [legacyAdmin]);
  if (legacyAdmin) return <Suspense fallback={<div className="loading-screen">INITIALIZING PORTAL...</div>}><AdminConsole /></Suspense>;
  return <div className="ecosystem-shell">
    <header className="ecosystem-header"><div className="ecosystem-header-inner"><Link className="ecosystem-brand" to="/" aria-label="Planetary-max storefront"><span className="ecosystem-mark">✳</span><span>PORTAL-OS1 <small>MAX-SOVEREIGN</small></span></Link><nav ref={navRef} className="ecosystem-nav" aria-label="Ecosystem spaces">{spaces.map(space => <NavLink key={space.path} to={space.path} aria-current={space.path === '/storefront' && location.pathname === '/' ? 'page' : undefined} className={({ isActive }) => (isActive || (space.path === '/storefront' && location.pathname === '/')) ? 'active' : ''} end><span>{space.number}</span>{space.label}</NavLink>)}</nav><SystemTelemetryBar /></div></header>
    <main className="ecosystem-main"><div className="space-crumb"><Link to="/overview">YOUR UNIVERSE</Link><span>/</span><span>{spaces.find(s => s.path === location.pathname)?.label || (location.pathname === '/' ? 'Planetary-max' : 'PORTAL-OS1')}</span><span className="space-crumb-end">THE SOVEREIGN NETWORK &nbsp; ✳</span></div>
      <Routes><Route path="/" element={<ArtGalleryView />} /><Route path="/storefront" element={<ArtGalleryView />} /><Route path="/overview" element={<OverviewRoute />} /><Route path="/chess" element={<ChessArenaView />} /><Route path="/sports" element={<SportsSpace />} /><Route path="/umbrella" element={<UmbrellaSpace />} /><Route path="/beemax" element={<BeemaxSpace />} /><Route path="*" element={<NotFound />} /></Routes>
    </main>
    <footer className="ecosystem-footer" id="command-stream"><div className="footer-inner"><div className="footer-heading"><div><span className="space-kicker">BEEMAX / COMMAND STREAM</span><h2>What's on your mind<span>?</span></h2><p>Ask a question or enter a command.</p></div><Link to="/beemax">BEEMAX HUD ↗</Link></div><div className="ecosystem-terminal"><SovereignCommandTerminal compact /></div><div className="ecosystem-signoff"><span>✳ &nbsp; PORTAL-OS1 / MAX-SOVEREIGN</span><span>CREATE. COMPETE. CONNECT. &nbsp; ↗</span></div></div></footer>
  </div>;
}

export function App() { return <BrowserRouter><Ecosystem /></BrowserRouter>; }
export default App;
