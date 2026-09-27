// Read-only, sequential diagnostics. No login, content writes or cache-busting.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const base = process.env.PERF_BASE_URL || 'https://www.thoughtswhatever.in';
const label = process.env.PERF_LABEL || 'production-baseline';
const runs = Number(process.env.PERF_RUNS || 20);
const mode = process.argv[2] || 'http';
const out = `docs/performance/${label}-${mode}.json`;
const routes = process.env.PERF_ROUTES?.split(',') || ['/', '/reference', '/archive', '/series', '/authors', '/search', '/reference?type=AUDIO', '/api/search-index', '/admin'];
const samples = [];
const stats = values => {
  const s = values.filter(Number.isFinite).sort((a,b) => a-b);
  const p = x => s[Math.max(0, Math.ceil(s.length*x)-1)];
  return {n:s.length,min:s[0],p50:p(.5),p75:p(.75),p95:p(.95),p99:p(.99),max:s.at(-1)};
};
const save = () => {
  // Keep completed observations if Windows temporarily locks the output file.
  const data=JSON.stringify({base,label,mode,runs,createdAt:new Date().toISOString(),samples},null,2);
  try { fs.writeFileSync(out,data); }
  catch { fs.writeFileSync(out.replace('.json',`-${samples.length}.json`),data); }
};

if (mode === 'http') {
  for (let run=0; run<runs; run++) {
    for (const route of routes) {
      const raw = execFileSync('curl.exe',['--silent','--show-error','--max-time','45','--output','-','--dump-header','-','--write-out','\nPERF:%{json}',base+route],{encoding:'utf8',maxBuffer:8*1024*1024});
      const [headers,timing] = raw.split('\nPERF:');
      const t=JSON.parse(timing);
      const safeHeaders = Object.fromEntries(headers.split(/\r?\n/).filter(h=>/^(server|server-timing|x-vercel-cache|x-vercel-id|x-nextjs-cache|cache-control|cdn-cache-control|age|vary|location):/i.test(h)).map(h=>[h.slice(0,h.indexOf(':')).toLowerCase(),h.slice(h.indexOf(':')+1).trim()]));
      samples.push({route,run,status:t.http_code,streamError:/data-dgst="(?!NEXT_)/.test(headers),articleCount:(headers.match(/<article\b/g)||[]).length,dns:t.time_namelookup*1000,tcp:t.time_connect*1000,tls:t.time_appconnect*1000,ttfb:t.time_starttransfer*1000,total:t.time_total*1000,bytes:t.size_download,headers:safeHeaders});
    }
    save();
    if ((run+1)%5===0) console.log(`HTTP ${run+1}/${runs}`);
  }
  for(const route of routes) console.log(route,stats(samples.filter(s=>s.route===route).map(s=>s.ttfb)));
} else {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    for(let run=0;run<runs;run++) {
      const context=await browser.newContext({viewport:{width:1365,height:900}});
      await context.addInitScript(() => {
        window.__perf={lcp:0,cls:0,longTasks:[],errors:[],content:0};
        new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__perf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
        new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__perf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
        new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__perf.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
        const observe=()=>{const m=new MutationObserver(()=>{if(!window.__perf.content&&document.querySelector('main article'))window.__perf.content=performance.now();});m.observe(document,{subtree:true,childList:true});}; observe();
      });
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.name));
      for(const route of routes.filter(r=>!r.startsWith('/api/')&&r!=='/admin')) {
        for(const scenario of ['first-in-context','repeat-hard']) {
          errors.length=0;
          let response;
          try { response=await page.goto(base+route,{waitUntil:'load',timeout:45000}); }
          catch(error) { samples.push({route,run,scenario,failed:true,error:error.message.split('\n')[0]}); save(); continue; }
          await page.waitForTimeout(1500); // observation window only; never application code
          const metric=await page.evaluate(()=>({
            navigation:performance.getEntriesByType('navigation')[0]?.toJSON(),
            paints:performance.getEntriesByType('paint').map(e=>e.toJSON()),
            ...window.__perf,
            resources:performance.getEntriesByType('resource').map(e=>({name:e.name,initiator:e.initiatorType,start:e.startTime,duration:e.duration,transfer:e.transferSize,encoded:e.encodedBodySize})),
            fonts:document.fonts.status,articles:document.querySelectorAll('main article').length,domNodes:document.querySelectorAll('*').length,
            images:[...document.querySelectorAll('main img')].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,loading:i.loading})),
          }));
          samples.push({route,run,scenario,status:response?.status(),...metric,errors:[...errors]});
          save();
        }
      }
      // Real Next Link transition; same context and assets as preceding routes.
      await page.goto(base+'/reference',{waitUntil:'load'});
      const books=page.locator('a[href="/reference?type=BOOK"]').first();
      if(await books.count()) {
        const start=await page.evaluate(()=>performance.now());
        await books.click();
        await page.waitForURL('**/reference?type=BOOK');
        await page.waitForTimeout(300);
        samples.push({route:'/reference?type=BOOK',scenario:'soft-link',run,urlChangeAndObservationMs:await page.evaluate(s=>performance.now()-s,start),rsc:await page.evaluate(s=>performance.getEntriesByType('resource').filter(e=>e.startTime>=s&&e.name.includes('_rsc')).map(e=>e.toJSON()),start)});
        save();
      }
      await context.close();
      console.log(`Browser ${run+1}/${runs}`);
    }
  } finally {await browser.close();}
}
