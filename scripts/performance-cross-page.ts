// Executes real data helpers outside React. Request-local React memoization is
// deliberately disabled; these are loader timings, not complete page timings.
import { loadEnvConfig } from '@next/env';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import React from 'react';
loadEnvConfig(process.cwd());
Object.assign(React, {cache: (fn: unknown) => fn});

async function main() {
  const p=await import('../src/lib/pieces');
  const a=await import('../src/lib/analytics');
  const {prisma}=await import('../src/lib/prisma');
  const first=await prisma.piece.findFirst({where:{status:'PUBLISHED'},select:{slug:true,kind:true}});
  const author=await prisma.author.findFirst({where:{pieces:{some:{status:'PUBLISHED'}}},select:{slug:true}});
  const samples:Array<{route:string;run:number;wallMs:number;bytes:number;serializationMs:number}>=[];
  const tasks: Record<string,()=>Promise<unknown>>={
    'home-initial-loaders':()=>Promise.all([p.getRecentPieces({take:20}),p.getFeaturedSeries(3),p.getFilterFacets(),p.countPieces('RACHANA'),p.countPieces('DOCUMENTARY'),p.countPieces('BLOG')]),
    'archive-loaders':()=>Promise.all([p.getArchivePieces({}),p.getFilterFacets()]),
    'series-loader':()=>p.getSeriesList(),
    'authors-loader':()=>p.getAuthorsList(),
    'admin-dashboard-data':()=>Promise.all([prisma.piece.findMany({select:{id:true,slug:true,kind:true,status:true,titleBn:true,updatedAt:true},orderBy:{updatedAt:'desc'},take:8}),a.getOverviewStats('30d'),a.getDailyTrend(30),a.getTopArticles(10,'30d'),a.getSeriesAnalytics()]),
  };
  if(first)tasks['story-primary-loader']=()=>p.getPieceBySlug(first.slug,first.kind);
  if(author)tasks['author-detail-loader']=()=>p.getAuthorBySlug(author.slug);
  try {
    for(let run=0;run<20;run++){
      for(const [route,task] of Object.entries(tasks)){
        const start=performance.now();const value=await task();const wallMs=performance.now()-start;
        const serialization=performance.now();const json=JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
        samples.push({route,run,wallMs,bytes:Buffer.byteLength(json),serializationMs:performance.now()-serialization});
      }
      fs.writeFileSync('docs/performance/cross-page-database.json',JSON.stringify({environment:'workstation; no React request cache; no authentication or render included',samples},null,2));
      if((run+1)%5===0)console.log(`Cross-page ${run+1}/20`);
    }
  } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.name,e.code||'loader benchmark failed');process.exitCode=1;});
