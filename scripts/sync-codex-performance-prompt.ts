import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { prisma } from '../src/lib/prisma';

loadEnvConfig(process.cwd());
async function main() {
  const prompts=[
    fs.readFileSync('docs/performance/brief.md','utf8'),
    'https://www.thoughtswhatever.in/',
    'continue and use less token',
  ];
  let inserted=0;
  for(const item of prompts) {
    if(await prisma.promptLog.findFirst({where:{text:item},select:{id:true}}))continue;
    await prisma.promptLog.create({data:{text:item,summary:item.slice(0,80).replace(/\s+/g,' '),source:'codex',category:'plan',status:'done',tags:['performance','codex']}});
    inserted++;
  }
  console.log(`Codex prompts synced: ${inserted} new records`);
}
main().catch(e=>{console.error('Codex prompt sync failed',e.name);process.exitCode=1;}).finally(()=>prisma.$disconnect());
