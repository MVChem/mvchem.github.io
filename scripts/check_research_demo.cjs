const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {chromium}=require(path.resolve(root,'../../06/bodymaps_research_warmup/frontend/node_modules/playwright'));
const base=process.argv[2]||'http://127.0.0.1:8077';
const slug=process.argv[3]||'local';
const report={base,checkedAt:new Date().toISOString(),checks:[],pageErrors:[],failedResponses:[]};
async function slices(page){await page.waitForFunction(()=>document.querySelectorAll('.vd-slice-image canvas').length===3&&document.querySelectorAll('.vd-slice-image .vd-view-message').length===0,null,{timeout:60000})}
async function surface(page){await page.locator('.vd-surface-host canvas').waitFor();await page.waitForFunction(()=>document.querySelectorAll('.vd-surface-stage .vd-view-message').length===0,null,{timeout:60000})}
(async()=>{
  const proxyValue=process.env.HTTPS_PROXY||process.env.https_proxy||process.env.ALL_PROXY||process.env.all_proxy;
  let proxy;
  if(base.startsWith('https://')&&proxyValue){const url=new URL(proxyValue);proxy={server:`${url.protocol}//${url.hostname}${url.port?':'+url.port:''}`,username:decodeURIComponent(url.username)||undefined,password:decodeURIComponent(url.password)||undefined}}
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,proxy,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1500,height:1080},baseURL:base});
  page.on('pageerror',error=>report.pageErrors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))report.failedResponses.push({url:response.url(),status:response.status()})});
  try{
    await page.goto(base+'/demo/',{waitUntil:'domcontentloaded'});await page.locator('.vd-metrics').waitFor({timeout:60000});
    const manifest=await page.request.get(base+'/api/demo/vertebrae.json').then(r=>r.json());
    for(const id of ['BDMAP_00000006','BDMAP_00000031']){
      await page.getByLabel('Select CT case',{exact:true}).selectOption(id);await page.waitForFunction(id=>document.querySelector('.vd-metrics p')?.textContent.includes(id),id);
      const item=manifest.cases.find(item=>item.id===id);
      for(const plane of ['Sagittal','Coronal','Axial']){
        await page.locator('.vd-plane-tabs').getByRole('button',{name:plane,exact:true}).click();
        await page.getByRole('button',{name:'Inspect an edit',exact:true}).click();await slices(page);
        const native=await page.locator('.vd-slice-image canvas').evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.nativeIndex)));
        assert.deepEqual(native,[item.change_indices[plane.toLowerCase()],item.change_indices[plane.toLowerCase()],item.change_indices[plane.toLowerCase()]]);
        const equal=await page.locator('.vd-slice-image canvas').evaluateAll(nodes=>{
          const a=nodes[0].getContext('2d').getImageData(0,0,nodes[0].width,nodes[0].height).data,b=nodes[1].getContext('2d').getImageData(0,0,nodes[1].width,nodes[1].height).data;
          return a.every((value,index)=>value===b[index]);
        });assert.equal(equal,false,'Authentic changed slice must show different before and after pixels');
      }
      await page.getByRole('button',{name:'Hide all',exact:true}).click();await slices(page);
      assert.equal(await page.locator('.vd-label-list input:checked').count(),0);
      await page.getByRole('button',{name:'Show all',exact:true}).click();await slices(page);await surface(page);
      await page.locator('.vd-surface-toolbar').getByRole('button',{name:'Before',exact:true}).click();await surface(page);
      await page.locator('.vd-surface-toolbar').getByRole('button',{name:'After',exact:true}).click();await surface(page);
      await page.getByRole('button',{name:'Soft tissue',exact:true}).click();await slices(page);assert.equal(await page.getByLabel('HU window',{exact:true}).inputValue(),'400');
      await page.getByRole('button',{name:'Bone',exact:true}).click();await slices(page);
      assert.equal(await page.locator('tbody tr').count(),24);
      await page.getByLabel('Audit label scope',{exact:true}).selectOption('flagged');assert.ok(await page.locator('tbody tr').count()>0);
      await page.getByLabel('Audit label scope',{exact:true}).selectOption('all');
      report.checks.push(id+': three native edit locations, actual before/after pixels, HU presets, label visibility, 24-label audit and real WebGL before/after surfaces');
      console.log('Passed',id);
    }
    await page.locator('.vd-plane-tabs').getByRole('button',{name:'Sagittal',exact:true}).click();await page.getByLabel('Reset slice zoom',{exact:true}).click();await slices(page);
    const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export audit',exact:true}).click();const download=await downloadEvent;await download.saveAs(path.join(root,`artifacts/demo_${slug}_export.json`));
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,`artifacts/demo_${slug}_export.json`))).id,'BDMAP_00000031');
    for(const key of ['script','csv','masks'])assert.equal((await page.request.get(base+manifest.downloads[key])).status(),200);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(root,`artifacts/demo_${slug}_desktop.png`),fullPage:true});await page.screenshot({path:path.join(root,`artifacts/demo_${slug}_viewport.png`)});
    await page.locator('#geometry').screenshot({path:path.join(root,`artifacts/demo_${slug}_3d.png`)});
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal page overflow');
    await page.getByRole('button',{name:'Visible labels'}).click();await page.getByRole('button',{name:'Hide all',exact:true}).click();await slices(page);await page.getByRole('button',{name:'Show all',exact:true}).click();await surface(page);
    await page.getByRole('button',{name:'Visible labels'}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(root,`artifacts/demo_${slug}_mobile.png`)});
    await page.locator('.vd-plane-tabs').getByRole('button',{name:'Axial',exact:true}).click();await slices(page);await page.locator('#comparison').screenshot({path:path.join(root,`artifacts/demo_${slug}_mobile_comparison.png`)});
    await page.getByRole('link',{name:'Back to homepage',exact:true}).click();await page.locator('.profile').waitFor();
    await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:'Demo',exact:true}).click();await page.locator('.vd-metrics').waitFor();
    report.checks.push('Audit JSON and three downloads; desktop/mobile rendering; mobile label controls; homepage → Demo navigation and back; no page overflow');
    assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedResponses,[]);report.status='passed';
  }finally{await browser.close();fs.writeFileSync(path.join(root,`artifacts/demo_${slug}_verification.json`),JSON.stringify(report,null,2)+'\n')}
})().catch(error=>{console.error(error);process.exitCode=1});
