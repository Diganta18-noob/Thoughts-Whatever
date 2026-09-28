import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { prisma } from '../src/lib/prisma';

loadEnvConfig(process.cwd());
async function main() {
  const prompts=[
    fs.readFileSync('docs/performance/brief.md','utf8'),
    'https://www.thoughtswhatever.in/',
    'continue and use less token',
    'only 15% limit is left so donot use much token and tell me how i can improve my admin portal more with more feature and more production ability',
    'do it and use very less token',
    'My computer went to sleep while you were working. Please continue from where you left off.',
    'the letter section is not wokring means try to make it work after enterring mail addressh nothing happen',
    'this is the admin dashboard , see the admin portal and detailed understand the admin portal and features and tryto improve my admin portal more professional , act like a senior data analysit , and also i have not found any analytics of reference tab activity . and https://www.vengenceui.com/docs/install-nextjs,https://skiper-ui.com/, https://animmasterlib.dev/ ,https://sceneai.art/, use this thing to improve the full admin portal . try to use less token and be fast',
    'Use Vengeance UI, Skiper UI, Animmaster Lib, and SceneAI to improve the full admin portal UI and animation. Keep it fast and use fewer tokens.',
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
