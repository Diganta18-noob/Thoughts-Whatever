import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma } from '@prisma/client';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { deriveCapabilities } from '../src/lib/reference/rights-engine';

loadEnvConfig(process.cwd());
const db = new PrismaClient({log:[{emit:'event',level:'query'}]});
const events: number[]=[];
db.$on('query',event=>events.push(event.duration)); // Never retain SQL or parameters.
const samples: Record<string,unknown>[]=[];
const summarize=(v:number[])=>{
  const s=[...v].sort((a,b)=>a-b);
  const p=(n:number)=>s[Math.max(0,Math.ceil(s.length*n)-1)];
  return {n:s.length,min:s[0],p50:p(.5),p75:p(.75),p95:p(.95),p99:p(.99),max:s.at(-1)};
};
const original = {
  author:{select:{id:true,slug:true,nameBn:true,nameEn:true}},
  editions:{take:1,orderBy:{publicationYear:'asc'},include:{rights:true,sources:{take:1},assets:true}},
} satisfies Prisma.ReferenceWorkInclude;
const candidate = {
  id:true,slug:true,titleBn:true,titleEn:true,subtitleBn:true,type:true,language:true,era:true,
  author:{select:{id:true,slug:true,nameBn:true,nameEn:true}},
  editions:{take:1,orderBy:{publicationYear:'asc'},select:{
    id:true,editor:true,publisher:true,publicationYear:true,coverImage:true,hostingMode:true,
    rights:{select:{status:true}},sources:{take:1,select:{sourceName:true,sourceUrl:true}},
    assets:{select:{kind:true,fileUrl:true,isDownloadable:true,isOnlineReadable:true,transcriptText:true}},
  }},
} satisfies Prisma.ReferenceWorkSelect;
type Row=Prisma.ReferenceWorkGetPayload<{select:typeof candidate}>;
function visible(rows:Row[]) {
  return rows.map(w=>{
    const e=w.editions[0];
    return {id:w.id,slug:w.slug,titleBn:w.titleBn,titleEn:w.titleEn,subtitleBn:w.subtitleBn,type:w.type,language:w.language,era:w.era,author:w.author,
      edition:e?{id:e.id,editor:e.editor,publisher:e.publisher,publicationYear:e.publicationYear,coverImage:e.coverImage,rights:e.rights,source:e.sources[0]?{sourceName:e.sources[0].sourceName,sourceUrl:e.sources[0].sourceUrl}:null}:null,
      capabilities:deriveCapabilities({rightsStatus:e?.rights?.status||'RIGHTS_UNVERIFIED',hostingMode:e?.hostingMode||'EXTERNAL',assets:e?.assets||[],sourceUrl:e?.sources[0]?.sourceUrl||null})};
  });
}
async function oldStats(){return Promise.all([
  db.referenceWork.count({where:{published:true}}),
  db.referenceWork.count({where:{published:true,type:{in:['BOOK','ARTICLE']}}}),
  db.referenceWork.count({where:{published:true,type:{in:['DOCUMENT','MANUSCRIPT','ARCHIVE']}}}),
  db.referenceSource.count(),db.referenceWork.count({where:{published:true,type:'AUDIO'}}),
]);}
async function newStats(){
  const [groups,sources]=await Promise.all([
    db.referenceWork.groupBy({by:['type'],where:{published:true},_count:{_all:true}}),db.referenceSource.count(),
  ]);
  const count=(types:string[])=>groups.filter(g=>types.includes(g.type)).reduce((n,g)=>n+g._count._all,0);
  return [groups.reduce((n,g)=>n+g._count._all,0),count(['BOOK','ARTICLE']),count(['DOCUMENT','MANUSCRIPT','ARCHIVE']),sources,count(['AUDIO'])];
}
async function measure(name:string,run:number,fn:()=>Promise<unknown>){
  events.length=0;
  const start=performance.now();const value=await fn();const wallMs=performance.now()-start;
  const sqlEvents=[...events];const serializationStart=performance.now();
  const json=JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  samples.push({name,run,wallMs,sqlEventCount:sqlEvents.length,sqlEventMs:sqlEvents,bytes:Buffer.byteLength(json),serializationMs:performance.now()-serializationStart});
  return value;
}
async function main(){
  const start=performance.now();await db.$connect();const initializationMs=performance.now()-start;
  for(let run=0;run<20;run++)await measure('warm-ping',run,()=>db.$queryRaw`SELECT 1`);
  const where={published:true};const common={where,take:12,skip:0,orderBy:[{featured:'desc'},{createdAt:'desc'}]} satisfies Prisma.ReferenceWorkFindManyArgs;
  assert.deepEqual(visible(await db.referenceWork.findMany({...common,include:original})).map(r=>({...r,edition:r.edition?{...r.edition,rights:r.edition.rights?{status:r.edition.rights.status}:null}:null})),visible(await db.referenceWork.findMany({...common,select:candidate})));
  assert.deepEqual(await oldStats(),await newStats());
  for(let run=0;run<20;run++){
    const variants=run%2?['candidate','original']:['original','candidate'];
    for(const variant of variants){
      const find=()=>variant==='original'?db.referenceWork.findMany({...common,include:original}):db.referenceWork.findMany({...common,select:candidate});
      await measure(`${variant}-select`,run,find);
      await measure(`${variant}-full`,run,()=>Promise.all([
        db.referenceWork.count({where}),find(),variant==='original'?oldStats():newStats(),
      ]));
    }
    if((run+1)%5===0)console.log(`Reference ${run+1}/20`);
  }
  const plan=await db.$queryRaw<Array<Record<string,unknown>>>`EXPLAIN (ANALYZE, FORMAT JSON) SELECT "type", COUNT(*) FROM "ReferenceWork" WHERE published = true GROUP BY "type"`;
  const summary=Object.fromEntries([...new Set(samples.map(s=>String(s.name)))].map(name=>[name,summarize(samples.filter(s=>s.name===name).map(s=>Number(s.wallMs)))]));
  fs.writeFileSync('docs/performance/reference-database.json',JSON.stringify({createdAt:new Date().toISOString(),environment:'workstation to configured DB; NOT production server',initializationMs,summary,samples,aggregatePlan:plan},null,2));
  console.log(JSON.stringify({initializationMs,summary},null,2));
}
main().catch(e=>{console.error(e.name,e.code||'benchmark failed');process.exitCode=1;}).finally(()=>db.$disconnect());
