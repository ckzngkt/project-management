// 学習サイト共通の仕組み。「自然言語処理入門」と同じ構成（ホーム・分野マップ・章・実験・印刷）を、
// content.js の SITE / AREAS / SOURCES / FIELDS / LESSONS から組み立てる。サイト間で同じファイルを使う。
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const plain=h=>String(h).replace(/<[^>]*>/g,' ');

// ---------- 保存（このブラウザだけ） ----------
let state={done:[],notes:{},answers:{}};
function loadState(){
  try{const s=JSON.parse(localStorage.getItem(SITE.key));if(s&&Array.isArray(s.done)){state={done:s.done,notes:s.notes||{},answers:s.answers||{}};return}}catch(e){}
  // 旧レイアウト（{done:{id:true},memo:{id:{n:text}}}）の進捗とメモを引き継ぐ
  try{const o=SITE.legacyKey&&JSON.parse(localStorage.getItem(SITE.legacyKey));if(o&&o.done){
    state.done=Object.keys(o.done).filter(k=>o.done[k]).map(k=>Number(k)-1).filter(i=>i>=0&&i<LESSONS.length);
    Object.entries(o.memo||{}).forEach(([k,v])=>{state.answers[Number(k)-1]=v});save()}}catch(e){}
}
function save(){try{localStorage.setItem(SITE.key,JSON.stringify(state));return true}catch(e){return false}}

// ---------- 本文で使う部品 ----------
const bars=(labels,values,max=1,opts={})=>`<div class="bars">${labels.map((l,i)=>`<div class="barrow"><span>${l}</span><div class="bartrack"><div class="barfill ${(opts.crit||[]).includes(i)?'crit':''}" style="width:${Math.max(0,Math.min(100,values[i]/max*100))}%"></div></div><span>${opts.fmt?opts.fmt(values[i]):values[i]}</span></div>`).join('')}</div>`;

function lessonSearchText(l){
  return plain([l.title,l.subtitle,l.summary,l.goal,...(l.tags||[]),...l.sections.flat(),...l.takeaways].join(' ')).normalize('NFKC').toLowerCase();
}

// ---------- サイドバー ----------
function nav(){
  const q=$('#search').value.normalize('NFKC').trim().toLowerCase();
  const active=location.hash||'#home';
  let html=`<a class="navitem ${active==='#home'?'active':''}" href="#home"><span class="num">⌂</span>学習マップ</a><a class="navitem ${active==='#fields'?'active':''}" href="#fields"><span class="num">◇</span>${SITE.fieldsNav}</a>`;
  let hits=0;
  AREAS.forEach(a=>{
    const items=LESSONS.map((l,i)=>({l,i})).filter(({l})=>l.area===a.id&&(!q||lessonSearchText(l).includes(q)));
    if(!items.length)return;
    hits+=items.length;
    if(!q)html+=`<div class="nav-phase">${a.name}</div>`;
    html+=items.map(({l,i})=>{const cur=active===`#chapter-${i+1}`;return `<a class="navitem ${cur?'active':''} ${state.done.includes(i)?'done':''}" href="#chapter-${i+1}" ${cur?'aria-current="page"':''}><span class="num">${state.done.includes(i)?'✓':pad(i+1)}</span>${l.title}</a>`}).join('');
  });
  if(q&&!hits)html+='<p class="empty">該当する章がありません。</p>';
  $('#nav').innerHTML=html;
  $('#count').textContent=`${state.done.length} / ${LESSONS.length}`;
  $('#progress').max=LESSONS.length;$('#progress').value=state.done.length;
}

// ---------- ホーム ----------
function sourceLinks(keys){return keys.map(k=>{const [t,u]=SOURCES[k];return u?`<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`:`<span class="src">${t}</span>`}).join('')}
function home(){
  const next=LESSONS.findIndex((_,i)=>!state.done.includes(i));
  const start=next<0?0:next;
  const planned=AREAS.reduce((n,a)=>n+(a.planned||[]).length,0);
  return `<div class="home"><div class="hero"><div><p class="eyebrow">${SITE.eyebrow}</p><h1>${SITE.heroTitle}</h1><p class="lead">${SITE.lead}</p><a class="primary" href="#chapter-${start+1}">${state.done.length?`続きから：第${start+1}章`:'第1章から始める'} <span aria-hidden="true">↗</span></a></div><div class="hero-visual" aria-label="${esc(SITE.heroLabel)}">${SITE.heroVisual}</div></div>
<div class="facts">${SITE.facts.map(([b,s])=>`<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>
<a class="field-teaser" href="#fields"><span>${SITE.teaser[0]}</span><b>${SITE.teaser[1]}</b><small>${SITE.teaser[2]} →</small></a>
<div class="sectionhead"><h2>学習マップ</h2><small>${planned?`公開 ${LESSONS.length}章 · 準備中 ${planned}章`:`全${LESSONS.length}章を${AREAS.length}つの段階に分けています。`}</small></div>
${AREAS.map((a,n)=>{const ls=LESSONS.map((l,i)=>({l,i})).filter(({l})=>l.area===a.id);return `<section class="phase"><div class="phase-label">PHASE ${pad(n+1)}<b>${a.name}</b>${a.lead}</div><div class="cards">${ls.map(({l,i})=>`<a class="chaptercard" href="#chapter-${i+1}"><span class="index">${pad(i+1)} ${state.done.includes(i)?'✓':''}</span><h3>${l.title}</h3><p>${l.subtitle}</p><small>学習時間の目安 ${l.time}分 <span aria-hidden="true">↗</span></small></a>`).join('')}${(a.planned||[]).map(t=>`<div class="chaptercard planned"><span class="index">準備中</span><h3>${t}</h3><p>学んだ順に追加します</p></div>`).join('')}</div></section>`}).join('')}
<div class="guide"><h3>学習の進め方（3ステップ）</h3>${SITE.steps.map(([t,d],i)=>`<p><b>${i+1}. ${t}</b> ${d}</p>`).join('')}<p>${SITE.stepsNote}</p></div>
${SITE.schedule?`<div class="sectionhead"><h2>${SITE.schedule.title}</h2><small>${SITE.schedule.small}</small></div><div class="schedule">${SITE.schedule.weeks.map((x,i)=>`<div><b>Week ${i+1}</b>${x}</div>`).join('')}</div>`:''}
<div class="sectionhead"><h2>この教材について・参考資料</h2></div><div class="sources"><p>${SITE.about}</p>${sourceLinks(SITE.homeSources)}</div></div>`;
}

// ---------- 分野マップ ----------
function fieldItem(item){
  const [name,type,desc,example,chapter,label]=item;
  return `<details class="topic" data-search="${esc(plain(item.join(' ')).toLowerCase())}"><summary><span class="topic-name">${name}</span><span class="type-tag">${type}</span><span class="topic-plus" aria-hidden="true">＋</span></summary><div class="topic-body"><p>${desc}</p><div class="topic-example">${example}</div>${chapter?`<p><a href="#chapter-${chapter}">第${chapter}章 ${LESSONS[chapter-1].title}で学ぶ →</a></p>`:`<span class="topic-future">${label||'発展 · このサイトではまだ扱っていません'}</span>`}</div></details>`;
}
function fieldsPage(){
  const total=FIELDS.branches.reduce((a,g)=>a+g.items.length,0);
  return `<article class="field-page"><p class="eyebrow">${FIELDS.eyebrow}</p><h1>${FIELDS.title}</h1><p class="summary">${FIELDS.summary}</p>${FIELDS.note?`<div class="note">${FIELDS.note}</div>`:''}
<div class="map-tools"><label for="field-search">分野・用語を探す<input type="search" id="field-search" placeholder="${FIELDS.placeholder}"></label><button id="expand-fields">説明をすべて開く</button><button id="collapse-fields">説明をすべて閉じる</button></div>
<p id="field-status" role="status" aria-live="polite">${total}項目 · 項目を開くと説明・例・関連章を表示</p>
<div class="map-root"><span class="logo">${SITE.logo}</span><div><b>${FIELDS.root[0]}</b><small>${FIELDS.root[1]}</small></div></div>
<div class="field-tree">${FIELDS.branches.map((g,i)=>`<section class="field-branch"><div class="branch-header"><span class="branch-number">${pad(i+1)}</span><div><h2>${g.name}</h2><p>${g.idea}</p></div></div><p class="branch-description">${g.description}</p><div class="branch-items">${g.items.map(fieldItem).join('')}</div></section>`).join('')}</div>
<p class="field-empty" hidden>該当する項目がありません。検索語を変えてください。</p>
${FIELDS.after||''}<a class="primary" href="#home">学習マップへ →</a>
<div class="sources" style="margin-top:28px"><b>参考</b>${sourceLinks(FIELDS.sources)}<p>分類と短い説明は、この教材の学習用に独自に整理したものです。</p></div></article>`;
}
function initFields(){
  const topics=$$('.topic');
  $('#field-search').oninput=()=>{
    const q=$('#field-search').value.normalize('NFKC').trim().toLowerCase();let count=0;
    $$('.field-branch').forEach(b=>{let v=0;const head=b.querySelector('h2').textContent.toLowerCase();b.querySelectorAll('.topic').forEach(t=>{const m=t.dataset.search.includes(q)||head.includes(q);t.hidden=!m;if(m){v++;count++}});b.hidden=v===0});
    $('#field-status').textContent=`${count} / ${topics.length}項目${q?' · 検索結果':' · 項目を開くと説明・例・関連章を表示'}`;
    $('.field-empty').hidden=count>0;
  };
  $('#expand-fields').onclick=()=>topics.filter(t=>!t.hidden).forEach(t=>t.open=true);
  $('#collapse-fields').onclick=()=>topics.forEach(t=>t.open=false);
}

// ---------- 実験（TRY IT YOURSELF） ----------
// compare：良い例と悪い例のどちらが良いかを選ぶ（全章に自動で付く）
// classify：項目ごとに分類を選び、答え合わせ
// slider：値を動かすと、状態が言葉と図で変わる（式は見せない）
// builder：型に沿って書き、文章にまとめてコピー
function labsOf(l,i){return [{type:'compare',ex:l.example,flip:i%2===1},...(l.labs||[])]}
function labMarkup(lab,print){
  switch(lab.type){
  case 'compare':{const [a,b]=lab.flip?[lab.ex.good,lab.ex.bad]:[lab.ex.bad,lab.ex.good];
    return `<h3>どちらが良い？</h3><p>同じ場面の2つのやり方です。良いと思う方を選んでください。</p><div class="choice-cards"><div data-card="0"><b>A</b>${a}</div><div data-card="1"><b>B</b>${b}</div></div><div class="lab-actions"><button data-pick="0">Aが良い</button><button data-pick="1">Bが良い</button></div><div class="labresult" aria-live="polite">${print?`<p><b>答え：${lab.flip?'A':'B'}</b></p><p>${lab.ex.why}</p>`:'<p>選ぶと、何を変えたかの説明が出ます。</p>'}</div>`}
  case 'classify':
    return `<h3>${lab.title}</h3><p>${lab.intro}</p><ol class="sortlist">${lab.items.map(([t,ans,why],j)=>`<li data-i="${j}"><span class="mark">${t}</span><select aria-label="${esc(plain(t))}の分類"><option value="">選ぶ…</option>${lab.options.map((o,k)=>`<option value="${k}">${o}</option>`).join('')}</select><p class="why" ${print?'':'hidden'}>答え：${lab.options[ans]}。${why}</p></li>`).join('')}</ol><div class="lab-actions"><button data-check>答え合わせ</button><button data-reset>やり直す</button></div><div class="labresult" aria-live="polite"><p>すべて選んでから答え合わせをしてください。</p></div>`;
  case 'slider':
    return `<h3>${lab.title}</h3><p>${lab.intro}</p><div class="labgrid">${lab.inputs.map(x=>`<div><label>${x.label}：<output data-out="${x.id}">${x.value}${x.unit||''}</output></label><input type="range" data-in="${x.id}" min="${x.min}" max="${x.max}" step="${x.step||1}" value="${x.value}"></div>`).join('')}</div><div class="labresult" aria-live="polite"></div>`;
  case 'builder':
    return `<h3>${lab.title}</h3><p>${lab.intro}</p>${lab.fields.map(f=>`<label>${f.label}</label>${f.multiline?`<textarea data-in="${f.id}" rows="2" maxlength="500">${esc(f.value)}</textarea>`:`<input data-in="${f.id}" maxlength="200" value="${esc(f.value)}">`}`).join('')}<div class="labresult builder-out" aria-live="polite"></div><div class="lab-actions"><button data-copy>文章をコピー</button><span class="copy-status" role="status"></span></div>`;
  case 'checklist':
    return `<h3>${lab.title}</h3><p>${lab.intro}</p><div class="checks">${lab.items.map((t,j)=>`<label><input type="checkbox" data-in="${j}">${t}</label>`).join('')}</div><div class="labresult" aria-live="polite"></div>`;
  }
}
function initLab(lab,el,interactive=true){
  const result=$('.labresult',el);
  const values=()=>Object.fromEntries($$('[data-in]',el).map(x=>[x.dataset.in,x.type==='checkbox'?x.checked:x.type==='range'?Number(x.value):x.value]));
  const update=()=>{
    if(lab.type==='slider'){const v=values();lab.inputs.forEach(x=>{$(`[data-out="${x.id}"]`,el).value=v[x.id]+(x.unit||'')});result.innerHTML=lab.render(v)}
    if(lab.type==='builder')result.textContent=lab.render(values());
    if(lab.type==='checklist'){const v=values();const n=Object.values(v).filter(Boolean).length;result.innerHTML=lab.render(n,lab.items.length,v)}
  };
  update();
  if(!interactive)return;
  $$('[data-in]',el).forEach(x=>x.addEventListener('input',update));
  if(lab.type==='compare')$$('[data-pick]',el).forEach(b=>b.onclick=()=>{
    const pick=Number(b.dataset.pick),good=lab.flip?0:1,ok=pick===good;
    $$('[data-card]',el).forEach(c=>c.classList.remove('picked-ok','picked-ng'));
    $(`[data-card="${pick}"]`,el).classList.add(ok?'picked-ok':'picked-ng');
    result.innerHTML=`<p><b>${ok?'その通りです。':`良いのは${good?'B':'A'}です。`}</b></p><p>${lab.ex.why}</p>`;
  });
  if(lab.type==='classify'){
    $('[data-check]',el).onclick=()=>{let ok=0,blank=0;
      $$('.sortlist li',el).forEach(li=>{const [, ans]=lab.items[li.dataset.i];const v=$('select',li).value;li.classList.remove('ok','ng');if(v===''){blank++;return}const hit=Number(v)===ans;if(hit)ok++;li.classList.add(hit?'ok':'ng');$('.why',li).hidden=false});
      result.innerHTML=`<p><b>${ok} / ${lab.items.length} 問 正解</b>${blank?`（未選択 ${blank}）`:''}</p><p>${ok===lab.items.length?'すべて正解です。':'説明を読んで、間違えた項目の考え方を確かめましょう。'}</p>`};
    $('[data-reset]',el).onclick=()=>{$$('.sortlist li',el).forEach(li=>{li.classList.remove('ok','ng');$('select',li).value='';$('.why',li).hidden=true});result.innerHTML='<p>すべて選んでから答え合わせをしてください。</p>'};
  }
  if(lab.type==='builder')$('[data-copy]',el).onclick=()=>copyText(result.textContent,$('.copy-status',el));
}
async function copyText(text,target){try{await navigator.clipboard.writeText(text);target.textContent='コピーしました'}catch(e){target.textContent='コピーできません。表示された文章を選択してコピーしてください。'}}

// ---------- 章 ----------
function lesson(i,print=false){
  const l=LESSONS[i],n=LESSONS.length,area=AREAS.find(a=>a.id===l.area);
  const ans=state.answers[i]||{};
  return `<article class="lesson" data-chapter="${i}"><div class="lesson-nav"><a href="#home">学習マップ</a> / ${area.name} / 第${i+1}章</div>
<p class="eyebrow">CHAPTER ${pad(i+1)} / ${pad(n)} · 学習時間の目安 ${l.time}分</p><h1>${l.title}</h1><p class="summary">${l.summary}</p><div class="tags">${l.tags.map(t=>`<span>${t}</span>`).join('')}</div>
<div class="objectives"><b>この章のゴール</b><p>${l.goal}</p></div>
${l.sections.map(([t,b],j)=>`<section><h2><span class="secnum">${pad(j+1)}</span>${t}</h2>${b}</section>`).join('')}
${labsOf(l,i).map((lab,k)=>`<div class="lab" data-lab="${k}"><span class="lab-heading">TRY IT YOURSELF${labsOf(l,i).length>1?` · ${k+1}`:''}</span>${labMarkup(lab,print)}</div>`).join('')}
<div class="quiz"><h3>理解チェック</h3>${l.quiz.map(([q,opts,a,why],k)=>`<div class="qitem" data-q="${k}"><p>Q${k+1}. ${q}</p>${opts.map((o,j)=>`<button class="answer" data-answer="${j}">${String.fromCharCode(65+j)}. ${o}</button>`).join('')}<div class="feedback" role="status" aria-live="polite"></div><div class="print-only">正解：${opts[a]}。${why}</div></div>`).join('')}</div>
<section class="exercise"><h3>自分の手で考える</h3>${l.exercise.map((e,k)=>`<div class="ex"><p>${k+1}. ${e.q}</p>${print?'':`<textarea data-answer-box="${k}" aria-label="演習${k+1}の自分の答え" placeholder="自分の答えを書いてみましょう（このブラウザに保存されます）">${esc(ans[k]||'')}</textarea>`}<details ${print?'open':''}><summary>解答の例を見る</summary><p>${e.a}</p></details></div>`).join('')}</section>
<div class="takeaways"><h3>この章のまとめ</h3><ul>${l.takeaways.map(t=>`<li>${t}</li>`).join('')}</ul></div>
${print?'':`<div class="memo"><label for="memo">学習メモ</label><textarea id="memo" placeholder="今日理解したこと、まだ疑問なこと、自分の言葉での説明…">${esc(state.notes[i]||'')}</textarea><small id="memo-status" aria-live="polite">このブラウザ内だけに保存します。別端末には同期されません。</small></div>
<div class="lesson-bottom"><a href="${i?`#chapter-${i}`:'#home'}">← ${i?'前の章':'学習マップ'}</a><button class="primary" id="complete">${state.done.includes(i)?'✓ 完了済み（取り消す）':'この章を完了にする'}</button><a href="${i<n-1?`#chapter-${i+2}`:'#home'}">${i<n-1?'次の章':'学習マップ'} →</a></div>`}
<div class="sources"><b>参考資料</b>${sourceLinks(l.sources)}</div></article>`;
}
function bindLesson(i){
  const l=LESSONS[i];
  labsOf(l,i).forEach((lab,k)=>initLab(lab,$(`.lab[data-lab="${k}"]`)));
  $$('.qitem').forEach(item=>{const [, , a,why]=l.quiz[item.dataset.q];
    $$('.answer',item).forEach(btn=>btn.onclick=()=>{const ok=Number(btn.dataset.answer)===a;$$('.answer',item).forEach(b=>b.classList.remove('correct','wrong'));btn.classList.add(ok?'correct':'wrong');$('.feedback',item).textContent=(ok?'正解です。':'もう一度考えてみましょう。')+(ok?' '+why:'')})});
  $$('[data-answer-box]').forEach(t=>t.oninput=()=>{state.answers[i]=state.answers[i]||{};state.answers[i][t.dataset.answerBox]=t.value;save()});
  $('#memo').oninput=()=>{state.notes[i]=$('#memo').value;$('#memo-status').textContent=save()?'メモをこのブラウザに保存しました。':'保存できません。メモをコピーして手元に残してください。'};
  $('#complete').onclick=()=>{state.done=state.done.includes(i)?state.done.filter(v=>v!==i):[...state.done,i];const ok=save();nav();
    $('#complete').textContent=state.done.includes(i)?'✓ 完了済み（取り消す）':'この章を完了にする';
    if(!ok)$('#memo-status').textContent='ブラウザ保存が使えないため、再読込すると進捗が消えます。'};
}

// ---------- 印刷（全章） ----------
function cleanPrintDocument(){$('#print-document')?.remove();document.body.classList.remove('print-all')}
function preparePrintDocument(){
  cleanPrintDocument();
  const out=document.createElement('div');out.id='print-document';
  out.innerHTML=`<p class="print-intro">${SITE.name} · ${SITE.title}。実験は初期設定の状態、演習とクイズは答えを表示しています。</p>`+home()+fieldsPage()+LESSONS.map((_,i)=>lesson(i,true)).join('');
  $$('.lesson',out).forEach((root,i)=>labsOf(LESSONS[i],i).forEach((lab,k)=>initLab(lab,$(`.lab[data-lab="${k}"]`,root),false)));
  $$('details',out).forEach(d=>d.open=true);
  $$('.quiz .answer',out).forEach(b=>{const d=document.createElement('div');d.className='print-choice';d.textContent=b.textContent;b.replaceWith(d)});
  $$('.lab input:not([type=checkbox]),.lab select,.lab textarea',out).forEach(x=>{const d=document.createElement('div');d.className='print-value';d.textContent=x.tagName==='SELECT'?'':x.value;x.replaceWith(d)});
  $$('button,.map-tools',out).forEach(x=>x.remove());
  $$('[id]',out).forEach(x=>x.removeAttribute('id'));$$('[for]',out).forEach(x=>x.removeAttribute('for'));
  document.body.appendChild(out);document.body.classList.add('print-all');
}

// ---------- 画面の切り替え ----------
function render(focus=false){
  const legacy=location.hash.match(/^#l(\d+)$/);
  if(legacy){history.replaceState(null,'',`#chapter-${legacy[1]}`)}
  nav();
  const m=location.hash.match(/^#chapter-(\d+)$/);const i=m?Number(m[1])-1:-1;
  if(location.hash==='#fields'){$('#main').innerHTML=fieldsPage();document.title=`${SITE.fieldsNav}｜${SITE.name}`;initFields()}
  else if(i<0||i>=LESSONS.length){$('#main').innerHTML=home();document.title=`${SITE.title}｜${SITE.name}`}
  else{$('#main').innerHTML=lesson(i);document.title=`第${i+1}章 ${LESSONS[i].title}｜${SITE.name}`;bindLesson(i)}
  if(focus){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true})}
}
loadState();
$('#search').oninput=nav;
$('.skip').onclick=e=>{e.preventDefault();$('#main').focus()};
window.addEventListener('hashchange',()=>render(true));
$('#print').onclick=()=>{preparePrintDocument();window.print()};
window.addEventListener('afterprint',cleanPrintDocument);
render();
