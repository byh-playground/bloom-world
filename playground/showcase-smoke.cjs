const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const NAME = process.env.SHOWCASE_GAME;
const GAMES = new Set(['squish-born','yarn-mayhem','meow-tumble','bloom-digmori','bloom-sketch-town','budmori-io','rally-frontier']);
if (!GAMES.has(NAME)) throw new Error('Invalid showcase game ' + NAME);
const ROOT = path.resolve('game');
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  let relative;
  try {relative=decodeURIComponent(pathname)==='/'?'index.html':decodeURIComponent(pathname).replace(/^\\/+/, '');}
  catch {res.writeHead(400).end();return;}
  const file=path.resolve(ROOT,relative);
  if (!file.startsWith(ROOT+path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file,(error,bytes)=>{
    if(error){res.writeHead(error.code==='ENOENT'?404:500).end();return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'}).end(bytes);
  });
});
const probe = async page => page.evaluate(()=>{
  const overlay=document.getElementById('bloom-showcase'), frame=overlay?.querySelector('iframe'),win=frame?.contentWindow,doc=win?.document;
  let game={};
  try{
    if(win?.BloomHatchery?.inspect)game=win.BloomHatchery.inspect().simulation;
    else if(win?.__YARN_MAYHEM?.snapshot)game=win.__YARN_MAYHEM.snapshot();
    else game={bodyView:doc?.getElementById('app')?.dataset?.view,startHidden:doc?.getElementById('startScreen')?.hidden,
      menuHidden:doc?.getElementById('menu')?.hidden,lobbyHidden:doc?.getElementById('lobby')?.classList.contains('hidden'),
      field:doc?.querySelector('#field,#world,#gl,#game')?.getBoundingClientRect().width};
  }catch(error){game={error:String(error)};}
  return {title:doc?.title,hostCaption:overlay?.querySelector('[data-copy]')?.textContent,
    hostSubtitle:overlay?.querySelector('[data-sub]')?.textContent,hostTime:overlay?.querySelector('[data-time]')?.textContent,
    hostIframe:frame?.src,childError:doc?.getElementById('error')?.textContent?.slice(0,420),
    loading:doc?.getElementById('boot')?.textContent?.slice(0,150),game};
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const viewport of [{width:1280,height:800},{width:844,height:390}]){
   const page=await browser.newPage({viewport});
   page.setDefaultTimeout(20000);
   const errors=[];
   page.on('pageerror',error=>{errors.push(error.message);console.log('PAGEERROR',error.message);});
   page.on('console',msg=>{if(['error','warning'].includes(msg.type()))console.log('BROWSER',msg.type(),msg.text().slice(0,220));});
   page.on('requestfailed',req=>console.log('NETWORK',req.url().slice(0,145),req.failure()?.errorText));
   try{
    const result=await page.goto('http://127.0.0.1:'+server.address().port+'/#/showcase',{waitUntil:'domcontentloaded',timeout:40000});
    assert.equal(result.status(),200);
    await page.locator('#bloom-showcase:not([hidden])').waitFor({state:'visible',timeout:30000});
    await page.locator('#bloom-showcase iframe').waitFor({state:'attached',timeout:30000});
    await page.waitForTimeout(8500);
    const state=await probe(page);
    console.log('GAME_SHOWCASE_STATE',NAME,JSON.stringify(viewport),JSON.stringify(state).slice(0,1500));
    assert.ok(state.hostCaption && !['실제 플레이 소개','소개를 실행하지 못했습니다'].includes(state.hostCaption),'A real chapter must play');
    assert.ok(!state.hostSubtitle?.includes('시간이 초과'),'Demo must load');
    assert.ok(!state.game?.error,'Game inspect must not throw');
    if(NAME==='squish-born')assert.equal(state.game.state,'running','Hatch intro starts an actual run');
    if(NAME==='yarn-mayhem')assert.equal(state.game.phase,'PLAYING','Yarn intro starts solo play');
    if(NAME==='meow-tumble')assert.equal(state.game.bodyView,'play','Cat intro starts game');
    if(NAME==='budmori-io')assert.equal(state.game.startHidden,true,'Farm intro starts garden');
    if(NAME==='bloom-digmori')assert.equal(state.game.menuHidden,true,'Digmori intro starts world');
    await page.locator('#bloom-showcase [data-action=close]').click();
    assert.equal(await page.locator('#bloom-showcase').isHidden(),true);
    assert.equal(new URL(page.url()).hash,'','Closing cleans route');
    const dir=path.resolve('showcase-artifacts');fs.mkdirSync(dir,{recursive:true});
    await page.screenshot({path:path.join(dir,NAME+'-'+viewport.width+'.png')});
    assert.deepEqual(errors,[],'No browser page errors');
    console.log('SHOWCASE_PASS',NAME,viewport.width);
   }finally{await page.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(async error=>{console.error('SHOWCASE_FAIL',NAME,error.stack||error);process.exitCode=1;try{await new Promise(resolve=>server.close(resolve));}catch{}});
