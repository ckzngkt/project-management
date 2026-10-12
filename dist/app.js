const STORE_KEY=SITE.key;
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaOf=(id)=>AREAS.find(a=>a.id===id);

function load(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||{done:{},memo:{}}}catch(e){return {done:{},memo:{}}}}
let state=load();
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state))}catch(e){}}

function searchText(l){return [l.title,l.subtitle,l.goal,...l.takeaways,...l.sections.map(s=>s[0]+s[1].replace(/<[^>]+>/g,''))].join(' ').toLowerCase()}

function nav(current){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const html=AREAS.map(a=>{
    const items=LESSONS.filter(l=>l.area===a.id&&(!q||searchText(l).includes(q)));
    if(!items.length)return '';
    return `<div class="nav-area" style="--c:${a.color}">${a.name}</div>`+items.map(l=>`<a href="#l${l.id}" class="${l.id===current?'active':''} ${state.done[l.id]?'done':''}"><span class="num">${String(l.id).padStart(2,'0')}</span><span>${l.title}</span></a>`).join('');
  }).join('');
  document.getElementById('nav').innerHTML=html||'<p class="muted" style="font-size:14px">見つかりませんでした</p>';
  const n=Object.values(state.done).filter(Boolean).length;
  document.getElementById('count').textContent=`${n} / ${LESSONS.length}`;
  document.getElementById('progress').max=LESSONS.length;document.getElementById('progress').value=n;
}

function home(){
  const next=LESSONS.find(l=>!state.done[l.id])||LESSONS[0];
  return `<section class="panel"><p class="eyebrow">${SITE.name.toUpperCase()}</p><h1>${SITE.hero}</h1><p class="lead">${SITE.lead}</p><div class="steps"><div><b>1. 読む</b>講義と例で型を理解する（1レッスン30分前後）</div><div><b>2. 手を動かす</b>演習を自分で書き、模範解答と比べる</div><div><b>3. 使う</b>まとめの3行を、翌日の仕事で1つ試す</div></div><p style="margin-top:18px"><a class="btn primary" href="#l${next.id}">${state.done[next.id]?'最初から':'続きから'}：${String(next.id).padStart(2,'0')} ${next.title} →</a></p></section>
<section class="panel"><h2>3つの分野</h2><div class="areas">${AREAS.map(a=>`<div class="area" style="--c:${a.color}"><h3>${a.name}</h3><p>${a.lead}</p><ol start="${LESSONS.find(l=>l.area===a.id).id}">${LESSONS.filter(l=>l.area===a.id).map(l=>`<li><a href="#l${l.id}">${l.title}</a></li>`).join('')}</ol></div>`).join('')}</div></section>
<section class="panel"><h2>この教材について</h2><p>${SITE.about}</p><p class="sources">主な参考文献：${Object.values(SOURCES).join('／')}</p></section>`;
}

function lesson(l){
  const a=areaOf(l.area);
  const prev=LESSONS[l.id-2],next=LESSONS[l.id];
  const memo=state.memo[l.id]||{};
  return `<article>
<section class="panel"><p class="eyebrow" style="color:${a.color}">${a.name} ・ LESSON ${String(l.id).padStart(2,'0')}</p><h1>${l.title}</h1><p class="lead">${l.subtitle}</p><div class="meta"><span>目安 ${l.time}分</span>${l.ka?`<span>知識エリア：${l.ka}</span>`:''}<span>${state.done[l.id]?'✓ 完了済み':'未完了'}</span></div><div class="goal"><b>このレッスンのゴール</b>${l.goal}</div></section>
${l.sections.map((s,i)=>`<section class="panel"><h2>${i+1}. ${s[0]}</h2>${s[1]}</section>`).join('')}
<section class="panel"><h2>良い例と悪い例</h2><div class="compare"><div class="bad"><b>BEFORE</b>${l.example.bad}</div><div class="good"><b>AFTER</b>${l.example.good}</div></div><p class="why"><b>何を変えたか：</b>${l.example.why}</p></section>
<section class="panel"><h2>演習</h2>${l.exercise.map((e,i)=>`<div class="q"><p>${e.q}</p><textarea data-memo="${i}" aria-label="演習${i+1}の回答" placeholder="自分の答えを書いてみましょう（このブラウザに保存されます）">${esc(memo[i]||'')}</textarea><p style="margin-top:8px"><button data-reveal="${i}">模範解答を見る</button></p><div class="answer" id="ans${i}" hidden><b>模範解答の例：</b>${e.a}</div></div>`).join('')}</section>
<section class="panel"><h2>確認クイズ</h2>${l.quiz.map((q,i)=>`<fieldset class="q" style="border:0;padding:0"><p>Q${i+1}. ${q[0]}</p>${q[1].map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join('')}<div class="fb" id="fb${i}" aria-live="polite"></div></fieldset>`).join('')}</section>
<section class="panel"><h2>まとめ</h2><ul class="takeaways">${l.takeaways.map(t=>`<li>${t}</li>`).join('')}</ul>${l.sources.length?`<p class="sources">参考：${l.sources.map(k=>SOURCES[k]).join('／')}</p>`:''}<div class="done-row"><button class="primary" id="done">${state.done[l.id]?'完了を取り消す':'このレッスンを完了にする'}</button></div></section>
<nav class="pager panel" aria-label="前後のレッスン">${prev?`<a href="#l${prev.id}">← ${String(prev.id).padStart(2,'0')} ${prev.title}</a>`:'<a href="#home">← ホーム</a>'}${next?`<a href="#l${next.id}">${String(next.id).padStart(2,'0')} ${next.title} →</a>`:'<a href="#home">ホームへ →</a>'}</nav>
</article>`;
}

function bindLesson(l){
  const main=document.getElementById('main');
  main.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>{const el=document.getElementById('ans'+b.dataset.reveal);el.hidden=!el.hidden;b.textContent=el.hidden?'模範解答を見る':'模範解答を閉じる'});
  main.querySelectorAll('[data-memo]').forEach(t=>t.oninput=()=>{state.memo[l.id]=state.memo[l.id]||{};state.memo[l.id][t.dataset.memo]=t.value;save()});
  l.quiz.forEach((q,i)=>main.querySelectorAll(`input[name=q${i}]`).forEach(r=>r.onchange=()=>{const ok=+r.value===q[2];const fb=document.getElementById('fb'+i);fb.className='fb '+(ok?'ok':'ng');fb.textContent=(ok?'正解。':'もう一度考えてみましょう。')+(ok?q[3]:'')}));
  document.getElementById('done').onclick=()=>{state.done[l.id]=!state.done[l.id];save();render()};
}

function render(){
  const m=location.hash.match(/^#l(\d+)$/);
  const l=m&&LESSONS[+m[1]-1];
  const main=document.getElementById('main');
  if(l){main.innerHTML=lesson(l);bindLesson(l);document.title=`${l.title}｜${SITE.name}`}
  else{main.innerHTML=home();document.title=`${SITE.title}｜${SITE.name}`}
  nav(l?l.id:0);
}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);document.getElementById('main').focus({preventScroll:true})});
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('search').addEventListener('input',()=>nav((location.hash.match(/^#l(\d+)$/)||[])[1]|0));render()});
