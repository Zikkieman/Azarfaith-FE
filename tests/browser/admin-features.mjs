import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin='http://127.0.0.1:18080', api='http://127.0.0.1:19000';
const browser=await chromium.launch({ executablePath:process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless:true });
const admin={ id:'admin', fullName:'Riverlight Admin', email:'admin@example.com', role:'platform_admin', status:'active', isVerified:true };
const date='2026-10-11T00:00:00.000Z', requestId='891c0af9-bad2-444d-a3d0-9a8a15ea9f27';
let passed=0;
async function run(name, fn, width=1440) {
  const context=await browser.newContext({ viewport:{ width,height:1000 } });
  const page=await context.newPage(), errors=[],calls=[];
  page.on('pageerror', e=>errors.push(e.message));
  let giving={ givingPaused:false,givingVersion:1,givingPausedAt:null,givingPauseReason:null }, firstPause=true;
  const row={ id:'org', name:'Riverlight Gospel Mission', detail:'Ibadan',image:null,status:'pending',category:'other',mode:null,type:null,urgency:null,amount:10000,count:1,checks:4,createdAt:date,submittedAt:date,updatedAt:date,emailVerified:null };
  let requests=[{ id:requestId,requesterId:'owner',ownerType:'USER',ownerId:'owner',ownerName:'Riverlight Owner',amount:5000,note:'Outreach supplies',status:'OPEN',decisionReason:null,createdAt:date,updatedAt:date,transfer:null }];
  const owner={ ownerType:'user',ownerId:'owner',ownerName:'Riverlight Owner',availableBalance:9750,totalCollected:10000,totalPlatformFees:250,totalNetCollected:9750,totalReleased:0,campaignCount:1,payoutAccount:{ id:'bank',active:true,status:'verified',bankName:'Fixture Bank',accountNumberMasked:'******6789',accountName:'Riverlight Owner' } };
  for (const host of ['fonts.googleapis.com','accounts.google.com','images.unsplash.com','placehold.co']) await context.route(`https://${host}/**`, r=>r.abort());
  await context.route(`${api}/**`, async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
    const headers={ 'access-control-allow-origin':origin,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-headers':'content-type' };
    if(method==='OPTIONS') return route.fulfill({ status:204,headers });
    const body=req.postData()?req.postDataJSON():null; calls.push({ path,method,body,query:url.search });
    let data,status=200;
    if(path==='/auth/session') data={ user:admin };
    else if(path==='/admin/review/notifications/inbox') data={ items:[],unreadCount:0,total:0,page:1,pageSize:8,asOf:date };
    else if(path==='/admin/review/dashboard') data={ totalUsers:2,totalOrganizations:1,verifiedOrganizations:0,pendingOrganizations:1,activeCampaigns:0,pendingCampaigns:1,totalRaised:10000,donationChart:[],campaignStatusChart:[],recentActivity:[] };
    else if(path==='/admin/review/analytics') {
      const days=url.searchParams.get('range')==='30d'?30:7;
      const current={ given:10000,gifts:1,users:2,organizations:1,campaigns:1 };
      data={ range:`${days}d`,timezone:'UTC',from:date,through:date,current,previous:current,change:{ given:0,gifts:0,users:0,organizations:0,campaigns:0 },series:Array.from({ length:days },(_,i)=>({ date:`2026-10-${String(i+1).padStart(2,'0')}`,...current,given:i===0?10000:0 })) };
    }
    else if(path==='/admin/review/giving-control') {
      if(method==='PATCH') {
        if(firstPause) { firstPause=false;status=409;data={ message:'Another admin changed giving controls. Refresh and review again.' }; }
        else { giving={ givingPaused:body.paused,givingVersion:giving.givingVersion+1,givingPausedAt:date,givingPauseReason:body.reason };data=giving; }
      } else data=giving;
    }
    else if(path.startsWith('/admin/review/directory/')) {
      if(path.endsWith('/bulk')) data={ applied:0,failed:1,results:[{ id:'org',outcome:'failed',message:'The submission changed. Review it again.' }] };
      else {
        const entity=path.split('/').at(-1);
        const items=entity==='organization'?[row]:entity==='user'?[{ ...row,id:'owner',name:'Riverlight Owner',detail:'owner@example.com',category:'donor',status:'active',emailVerified:true }]:[];
        data={ items:url.searchParams.get('page')==='2'?[]:items,total:11,page:Number(url.searchParams.get('page')??1),pageSize:Number(url.searchParams.get('pageSize')??10),hasMore:url.searchParams.get('page')!=='2' };
      }
    }
    else if(path==='/admin/review/organizations/org') data={ id:'org',ownerId:'owner',name:row.name,tagline:'Serving families',category:'other',verificationStatus:'pending',owner:{ id:'owner',fullName:'Owner',email:'owner@example.com' },location:'Ibadan',bio:'Mission',photos:[],links:[],registrationDocuments:[],campaigns:[],campaignIds:[],createdAt:date,submittedAt:date };
    else if(path.includes('/records/')) data={ notes:[],total:0,page:1,pageSize:8,hasMore:false,checklist:[] };
    else if(path==='/admin/review/settings') data={ platformFeePercent:2.5,minDonation:100,maxDonation:5000000,campaignExpiryDays:90,reapplicationDays:30,autoApproveVerifiedOrgs:false,requirePhoneForCampaigns:true,emailNotifications:true,adminNotificationEmail:'admin@example.com' };
    else if(path==='/admin/review/payouts') data={ items:[owner],history:[] };
    else if(path==='/admin/review/payout-requests') data=requests;
    else if(path.endsWith('/decline')) { requests=requests.map(r=>({ ...r,status:'DECLINED',decisionReason:body.reason }));data={ message:'Payout request declined.' }; }
    else if(path==='/admin/review/payouts/release') { requests=requests.map(r=>({ ...r,status:'PROCESSING',transfer:{ id:'transfer',status:'pending' } }));data={ id:'transfer',status:'pending' }; }
    else { status=404; data={ message:`Missing fixture ${path}` }; }
    await route.fulfill({ status,headers,contentType:'application/json',body:JSON.stringify(data) });
  });
  try { await fn(page,calls); assert.deepEqual(errors,[]);passed++;console.log(`PASS ${name}`); }
  catch(e) { console.error({ name,calls,text:await page.locator('body').textContent() });await page.screenshot({ path:'/private/tmp/azarfaith-qa/full-feature-failure.png',fullPage:true });throw e; }
  finally { await context.close(); }
}
try {
  await run('Server filtering pagination sorting and detail navigation', async(page,calls)=>{
    await page.goto(`${origin}/admin/orgs`);await page.getByRole('link',{ name:'Review Riverlight Gospel Mission' }).first().waitFor();
    await page.getByLabel('Status',{ exact:true }).selectOption('PENDING');
    await page.getByRole('button',{ name:'Received',exact:true }).click();
    await page.getByRole('button',{ name:'Next',exact:true }).click();await page.getByText('Page 2 of 2',{ exact:true }).waitFor();
    assert.ok(calls.some(c=>c.query.includes('sort=amount')&&c.query.includes('status=PENDING')&&c.query.includes('page=2')));
    await page.getByRole('button',{ name:'Previous',exact:true }).click();await page.getByRole('link',{ name:'Review Riverlight Gospel Mission' }).first().click();await page.waitForURL(`${origin}/admin/orgs/org`);
  });
  await run('Bulk partial failure stays visible and preserves reviewed version', async(page,calls)=>{
    await page.goto(`${origin}/admin/orgs`);await page.getByRole('checkbox',{ name:'Select Riverlight Gospel Mission' }).first().check();
    await page.getByRole('button',{ name:'Reject',exact:true }).click();await page.getByRole('dialog').getByLabel('Reason (required)').fill('Evidence needs correction.');
    await page.getByRole('dialog').getByRole('button',{ name:/Confirm/ }).click();await page.getByText('The submission changed. Review it again.',{ exact:false }).waitFor();
    const write=calls.find(c=>c.path.endsWith('/bulk'));assert.equal(write.body.records[0].version,date);assert.match(write.body.requestId,/^[\da-f-]{36}$/);assert.equal(write.body.action,'reject');
  });
  await run('Emergency giving conflict retains reason; retry uses captured version', async(page,calls)=>{
    await page.goto(`${origin}/admin/settings`);await page.getByRole('button',{ name:'Pause all giving' }).click();
    const dialog=page.getByRole('dialog');await dialog.getByLabel('Reason for the audit log').fill('Payment incident review');await dialog.getByLabel('Type PAUSE to confirm').fill('PAUSE');await dialog.getByRole('button',{ name:'Confirm',exact:true }).click();await dialog.getByRole('alert').waitFor();
    assert.equal(await dialog.getByLabel('Reason for the audit log').inputValue(),'Payment incident review');await dialog.getByRole('button',{ name:'Confirm',exact:true }).click();await dialog.waitFor({ state:'hidden' });await page.getByText('Giving is paused.',{ exact:true }).waitFor();
    assert.ok(calls.filter(c=>c.path.endsWith('giving-control')&&c.method==='PATCH').every(c=>c.body.expectedVersion===1));
  });
  await run('Real analytics range and CSV reporting',async(page,calls)=>{
    await page.goto(`${origin}/admin`);await page.getByRole('button',{ name:'Last 30 days' }).click();await page.getByRole('region',{ name:'Platform analytics' }).getByText('Donation volume',{ exact:true }).first().waitFor();
    await page.waitForFunction(()=>document.querySelectorAll('[role="img"][aria-label^="2026-"]').length===30);
    const download=page.waitForEvent('download');await page.getByRole('button',{ name:'Export report' }).click();assert.match((await download).suggestedFilename(),/30d/);assert.ok(calls.some(c=>c.query==='?range=30d'));
  });
  await run('Admin search opens actual result details',async(page,calls)=>{
    await page.goto(`${origin}/admin`);await page.getByRole('button',{ name:'Search admin records',exact:true }).click();await page.getByLabel('Search organizations campaigns or users').fill('Riverlight');await page.getByRole('dialog').getByRole('button',{ name:/Riverlight Gospel Mission/ }).click();await page.waitForURL(`${origin}/admin/orgs/org`);assert.ok(calls.some(c=>c.query.includes('search=Riverlight')));
  });
  await run('Payout request release uses owner request UUID and exact amount',async(page,calls)=>{
    await page.goto(`${origin}/admin/payouts`);const queue=page.locator('section').filter({ has:page.getByRole('heading',{ name:'Creator payout requests' }) });await queue.getByRole('button',{ name:'Review payout' }).click();await page.getByRole('dialog').getByRole('button',{ name:'Release via Paystack' }).click();await page.getByRole('dialog').waitFor({ state:'hidden' });const write=calls.find(c=>c.path.endsWith('/release'));assert.equal(write.body.requestId,requestId);assert.equal(write.body.amount,5000);
  });
  await run('Payout request rejection requires a reason and records real decision',async(page,calls)=>{
    await page.goto(`${origin}/admin/payouts`);await page.getByRole('button',{ name:'Decline',exact:true }).click();await page.getByRole('dialog').getByLabel('Decision reason').fill('Please clarify the accounting period.');await page.getByRole('dialog').getByRole('button',{ name:'Decline request',exact:true }).click();await page.getByRole('dialog').waitFor({ state:'hidden' });assert.equal(calls.find(c=>c.path.endsWith('/decline')).body.reason,'Please clarify the accounting period.');
  });
  for(const width of [320,390,820]) await run(`Responsive migrated tools ${width}px`,async(page)=>{
    for(const path of ['/admin','/admin/orgs','/admin/campaigns','/admin/users','/admin/settings','/admin/payouts']) {
      await page.goto(origin+path);await page.locator('.admin-page h1').waitFor();await page.waitForTimeout(200);const sizes=await page.evaluate(()=>({ w:innerWidth,doc:document.documentElement.scrollWidth }));assert.ok(sizes.doc<=sizes.w+1,JSON.stringify({ path,sizes }));
    }
    await page.screenshot({ path:`/private/tmp/azarfaith-qa/full-feature-${width}.png`,fullPage:true });
  },width);
  console.log(`Full-feature browser checks passed: ${passed}`);
} finally { await browser.close(); }
