'use strict';
const STORAGE_KEY = 'safimaint-simple-v7';
let CURRENT_USER = 'U-1';
const APP_VERSION = '8.0.0-shared-service';

const iso = () => new Date().toISOString();
const day = offset => {
  const d = new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+offset);
  return d.toISOString().slice(0,10);
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS',maximumFractionDigits:2}).format(Number(value||0));
const dateFmt = value => value ? new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '—';
const dateTimeFmt = value => value ? new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
const uid = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,5).toUpperCase()}`;
