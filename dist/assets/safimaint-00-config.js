'use strict';
const STORAGE_KEY = 'safimaint-simple-v7';
let CURRENT_USER = 'U-1';
const APP_VERSION = '9.7.0-current-fiix-supplies';

const iso = () => new Date().toISOString();
const day = offset => {
  const d = new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+offset);
  return d.toISOString().slice(0,10);
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => {
  const l=window.SafiLocalization||{locale:'en-GH',currency:'GHS'};
  try{return new Intl.NumberFormat(l.locale||'en-GH',{style:'currency',currency:l.currency||'GHS',maximumFractionDigits:2}).format(Number(value||0))}
  catch(_ignored){return new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS',maximumFractionDigits:2}).format(Number(value||0))}
};
const dateFmt = value => {
  if(!value)return '—';
  const l=window.SafiLocalization||{locale:'en-GB',timezone:'Africa/Accra',dateStyle:'medium'};
  try{return new Intl.DateTimeFormat(l.locale||'en-GB',{dateStyle:l.dateStyle||'medium',timeZone:l.timezone||'Africa/Accra'}).format(new Date(value))}
  catch(_ignored){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value))}
};
const dateTimeFmt = value => {
  if(!value)return '—';
  const l=window.SafiLocalization||{locale:'en-GB',timezone:'Africa/Accra'};
  try{return new Intl.DateTimeFormat(l.locale||'en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:l.timezone||'Africa/Accra'}).format(new Date(value))}
  catch(_ignored){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
};
const uid = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,5).toUpperCase()}`;
