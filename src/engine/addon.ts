/**
 * Approved Grade 12 Hot Potatoes responsive addon script.
 * Preserves Hot Potatoes globals (State, Score, Detail, Locked, Finish)
 * and extends them for matching cards, ordering drag/touch, crossword grid,
 * drafts, and download.
 */
export const APPROVED_HOTPOT_ADDON = `/* Responsive extensions. Original Hot Potatoes scoring globals are retained. */
var TGSent = false, TGSelected = '', TGDragged = null, TGShown = false, TGAudioURL = '', TGFocus = null;
function TGNorm(value, modes){
 modes=modes||['space','case'];var v=String(value||'').normalize('NFC');
 if(modes.includes('apostrophes'))v=v.replace(/[\\u2018\\u2019]/g,"'");
 if(modes.includes('contractions')){
  v=v.replace(/\\b(can't|won't|shan't)\\b/gi,function(m){return ({"can't":"can not","won't":"will not","shan't":"shall not"})[m.toLowerCase()]});
  v=v.replace(/\\bcannot\\b/gi,'can not').replace(/\\b(did|does|do|is|are|was|were|have|has|had|could|would|should|must|need)n't\\b/gi,'$1 not');
 }
 if(modes.includes('hyphens'))v=v.replace(/[-\\u2010-\\u2015]/g,' ');
 if(modes.includes('terminal'))v=v.replace(/[.!?]+\\s*$/,'');
 if(modes.includes('space'))v=v.replace(/\\s+/g,' ').trim();
 if(modes.includes('case'))v=v.toLowerCase();
 return v;
}
function TGNormalizeAnswer(i,raw){
 if(!raw || !TG.items[i]) return raw || '';
 var q=TG.items[i];
 if(q.maxwords && String(raw).trim().split(/\\s+/).length>q.maxwords) return '[word limit] '+raw;
 if(TG.paired){for(var p of TG.paired){if(p.correction===i){
  var le=document.getElementById('Gap'+p.letter), lv=le?le.value:(State[p.letter].Guesses.slice(-1)[0]||'');
  if(!p.pairs.some(function(v){return TGNorm(v[0])===TGNorm(lv)&&TGNorm(v[1])===TGNorm(raw)}))return '[check matching letter] '+raw;
 }}}
 for(var a of q.answer){if(TGNorm(a,q.normalization)===TGNorm(raw,q.normalization))return a;}
 return raw;
}
function TGStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
function TGRead(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(e){return fallback;}}
function TGXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function TGFinish(){
 if(typeof Detail!=='undefined'&&!Detail&&TG.kind!=='mc'&&TG.scored){
  Detail='<?xml version="1.0"?><hpnetresult><fields>';
  for(var i=0;i<State.length;i++){var value=(State[i].Guesses||[]).join(' | ');Detail+='<field><fieldname>Question #'+TG.items[i].n+'</fieldname><fieldtype>question-tracking</fieldtype><fieldlabel>Q '+TG.items[i].n+'</fieldlabel><fieldlabelid>QuestionTrackingField</fieldlabelid><fielddata>'+TGXml(value)+'</fielddata></field>';}
  Detail+='</fields></hpnetresult>';
 }
 var saved=TGRead(TG.storage_key+'-progress',{});
 saved[TG.id]={score:typeof Score==='number'?Score:null,at:new Date().toISOString(),assisted:TGShown};
 TGStore(TG.storage_key+'-progress',saved);TGUpdate();
}
function TGUpdate(){
 if(!TG.scored)return;
 var done=0;
 for(var i=0;i<TG.items.length;i++){
  var solved=TG.kind==='mc'?(State[i]&&State[i][0]>=0):(State[i]&&State[i].AnsweredCorrectly);
  if(solved)done++;
  var sp=document.getElementById('GapSpan'+i);
  if(sp&&solved)sp.classList.add('correct');
  var fb=document.getElementById('ItemFeedback'+i);
  if(fb&&solved)fb.hidden=false;
 }
 var el=document.getElementById('LocalProgress');
 if(el)el.textContent=done+' / '+TG.items.length+' scored responses completed'+(TGShown?' | Answers revealed: remaining responses earn no credit.':'');
 if(TG.kind==='match')TGUpdateTokens();
}
function TGAfterCheck(){
 for(var i=0;i<TG.items.length;i++){
  var sp=document.getElementById('GapSpan'+i);
  if(sp){sp.classList.toggle('incorrect',!State[i].AnsweredCorrectly);sp.classList.toggle('correct',!!State[i].AnsweredCorrectly);}
 }
 TGUpdate();TGSyncCrossLocked();
}
function TGAnswers(){
 if(!TG.scored)return;
 TGShown=true;
 for(var i=0;i<State.length;i++){
  if(TG.kind==='mc'){if(State[i]&&State[i][0]<0)State[i][4]+=1000;}
  else if(State[i]&&!State[i].AnsweredCorrectly){State[i].HintsAndChecks+=10000;State[i].ClueGiven=true;}
 }
 var panel = document.getElementById('AnswersPanel');
 if(panel) {
   panel.hidden=false;
   panel.scrollIntoView({behavior:'smooth',block:'start'});
 }
 TGUpdate();
}
function TGUpdateTokens(){
 var used=[];
 document.querySelectorAll('select.gap').forEach(function(s){if(s.value)used.push(s.value)});
 document.querySelectorAll('.GapSpan.correct').forEach(function(s){used.push(s.dataset.value||s.textContent.trim())});
 document.querySelectorAll('.token').forEach(function(b){b.classList.toggle('used',used.indexOf(b.dataset.value)>=0);b.classList.toggle('active',TGSelected===b.dataset.value);b.setAttribute('aria-pressed',TGSelected===b.dataset.value?'true':'false');});
}
function TGAssign(zone,value){
 var input=zone.querySelector('select.gap')||document.getElementById('Gap'+zone.dataset.gap);
 if(input && value && !(typeof Locked!=='undefined'&&Locked)){
  input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));TGSelected='';TGUpdateTokens();input.focus();
 }
}
function TGUpdateOrderButtons(){
 var cards=document.querySelectorAll('.ordercard');
 cards.forEach(function(card,idx){
  var btns=card.querySelectorAll('.orderbuttons button');
  if(btns.length>=2){
   btns[0].disabled=(idx===0);
   btns[1].disabled=(idx===cards.length-1);
  }
 });
}
function TGOrderSync(){
 var input=document.getElementById('Gap0');
 if(input)input.value=Array.from(document.querySelectorAll('.ordercard')).map(function(e){return e.dataset.value}).join('-');
 TGUpdateOrderButtons();
}
function TGMove(btn,dir){
 if(typeof Locked!=='undefined'&&Locked)return;
 var card=btn.closest('.ordercard'),list=card.parentElement,other=dir<0?card.previousElementSibling:card.nextElementSibling;
 if(other){
  if(dir<0)list.insertBefore(card,other);else list.insertBefore(other,card);
  TGOrderSync();
  TGUpdateOrderButtons();
  btn.focus();
 }
}
function TGSaveDraft(show){
 var data={};document.querySelectorAll('[data-save]').forEach(function(el){if(el.type==='radio'||el.type==='checkbox'){data[el.id]=el.checked;}else{data[el.id]=el.value;}});
 var ok=TGStore(TG.storage_key+'-draft-'+TG.id,data),status=document.getElementById('DraftStatus')||document.getElementById('WritingStatus');
 if(status&&show)status.textContent=ok?'Draft saved in this browser.':'Browser storage is unavailable. Use Download responses to keep your work.';
 return data;
}
function TGDownload(){
 var lines=[TG.course_title,TG.id+' - '+TG.title,'Date: '+new Date().toISOString(),TG.scored?'':'Teacher assessment required.'];
 document.querySelectorAll('[data-save]').forEach(function(el){if(el.type==='radio'||el.type==='checkbox'){if(el.checked)lines.push(el.dataset.label+': '+el.value);}else lines.push((el.dataset.label||el.id)+': '+el.value);});
 var blob=new Blob([lines.join('\\n\\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=TG.id+'-responses.txt';a.click();setTimeout(function(){URL.revokeObjectURL(url)},1000);TGSaveDraft(true);
}
function TGWordCount(){var t=document.getElementById('WritingDraft');if(!t)return;var s=t.value.trim();document.getElementById('WordCount').textContent=(s?s.split(/\\s+/).length:0)+' words';}
function TGInit(){
 var here=document.getElementById('ResetLocal');if(here&&!(location.protocol==='file:'||location.hostname==='127.0.0.1'||location.hostname==='localhost'))here.hidden=true;
 var saved=TGRead(TG.storage_key+'-draft-'+TG.id,{});
 document.querySelectorAll('[data-save]').forEach(function(el){if(Object.prototype.hasOwnProperty.call(saved,el.id)){if(el.type==='radio'||el.type==='checkbox')el.checked=saved[el.id];else el.value=saved[el.id];}el.addEventListener('input',function(){TGSaveDraft(false);TGWordCount();});});
 TGWordCount();
 document.querySelectorAll('input[type=checkbox][data-max-choices]').forEach(function(el){el.addEventListener('change',function(){var limit=Number(el.dataset.maxChoices),group=Array.from(document.querySelectorAll('input[type=checkbox][data-max-choices]')).filter(function(q){return q.name===el.name&&q.checked});if(limit&&group.length>limit){el.checked=false;var st=document.getElementById('DraftStatus');if(st)st.textContent='Choose at most '+limit+' options for this question.';TGSaveDraft(false);}});});
 document.querySelectorAll('.token').forEach(function(btn){
  btn.addEventListener('click',function(){TGSelected=TGSelected===btn.dataset.value?'':btn.dataset.value;TGUpdateTokens();});
  btn.addEventListener('dragstart',function(e){TGSelected=btn.dataset.value;e.dataTransfer.setData('text/plain',TGSelected);e.dataTransfer.effectAllowed='copy';TGUpdateTokens();});
 });
 document.querySelectorAll('.dropzone').forEach(function(zone){
  zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',function(){zone.classList.remove('dragover')});
  zone.addEventListener('drop',function(e){e.preventDefault();zone.classList.remove('dragover');TGAssign(zone,e.dataTransfer.getData('text/plain'));});
  zone.addEventListener('click',function(e){if(TGSelected&&e.target.tagName!=='OPTION'&&e.target.tagName!=='SELECT')TGAssign(zone,TGSelected);});
 });
 document.querySelectorAll('select.gap').forEach(function(el){el.addEventListener('change',TGUpdateTokens)});
 document.querySelectorAll('.ordercard').forEach(function(card){
  card.addEventListener('dragstart',function(e){if(typeof Locked!=='undefined'&&Locked){e.preventDefault();return;}TGDragged=card;e.dataTransfer.setData('text/plain',card.dataset.value);e.dataTransfer.effectAllowed='move';});
  card.addEventListener('dragover',function(e){e.preventDefault()});
  card.addEventListener('drop',function(e){e.preventDefault();if(TGDragged&&card!==TGDragged){var r=card.getBoundingClientRect();card.parentElement.insertBefore(TGDragged,e.clientY>r.top+r.height/2?card.nextSibling:card);TGOrderSync();TGUpdateOrderButtons();}TGDragged=null;});
 });
 if(document.querySelectorAll('.ordercard').length>0){TGOrderSync();TGUpdateOrderButtons();}
 var file=document.getElementById('AudioFile');if(file)file.addEventListener('change',function(){if(!file.files[0])return;if(TGAudioURL)URL.revokeObjectURL(TGAudioURL);TGAudioURL=URL.createObjectURL(file.files[0]);var player=document.getElementById('AudioPlayer');player.src=TGAudioURL;player.hidden=false;document.getElementById('AudioStatus').textContent='Recording loaded for this browser session. Complete the activity using this recording.';});
  document.addEventListener('keydown',function(e){var fb=document.getElementById('FeedbackDiv');if(fb&&fb.style.display==='block'){if(e.key==='Escape'){e.preventDefault();HideFeedback();}if(e.key==='Tab'){e.preventDefault();document.getElementById('FeedbackOKButton').focus();}}});
 document.querySelectorAll('textarea,input[type=text]').forEach(function(el){el.addEventListener('focus',function(){window.InTextBox=true});el.addEventListener('blur',function(){window.InTextBox=false});});
 if(TG.scored)TGUpdate();
 if(TG.kind==='crossword')TGInitCross();
}

function TGSyncControls(){
 if(TG.kind==='multi')document.querySelectorAll('[data-multi]').forEach(function(group){
  var input=document.getElementById('Gap'+group.dataset.multi);
  if(input)input.value=Array.from(group.querySelectorAll('input:checked')).map(function(e){return e.value}).sort().join('-');
 });
 if(TG.kind==='order')TGOrderSync();
}
function TGCrossCells(p){
 var word=TG.items[p.item]&&TG.items[p.item].answer&&TG.items[p.item].answer[0]?TG.items[p.item].answer[0]:'';
 return Array.from({length:word.length},function(_,k){
  return document.getElementById('Cell'+(p.row+(p.direction==='down'?k:0))+'_'+(p.col+(p.direction==='across'?k:0)));
 }).filter(Boolean);
}
function TGCrossFromGrid(input){
 if(typeof Locked!=='undefined'&&Locked)return;
 input.value=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(-1);
 if(TG.placements)TG.placements.forEach(function(p){
  var gap=document.getElementById('Gap'+p.item);
  var cells=TGCrossCells(p);
  if(gap&&cells.length>0)gap.value=cells.map(function(c){return c.value||' ';}).join('').trim();
 });
}
function TGInitCross(){
 if(!TG.placements)return;
 TG.placements.forEach(function(p){
  var gap=document.getElementById('Gap'+p.item);
  if(gap)gap.addEventListener('input',function(){
   var value=gap.value.toUpperCase().replace(/[^A-Z]/g,'');
   var cells=TGCrossCells(p);
   cells.forEach(function(cell,k){if(cell&&!cell.readOnly)cell.value=value[k]||'';});
   if(cells[0])TGCrossFromGrid(cells[0]);
  });
 });
 document.querySelectorAll('[data-cell]').forEach(function(cell){cell.addEventListener('keydown',function(e){
  var delta={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[e.key];
  if(!delta)return;var next=document.getElementById('Cell'+(Number(cell.dataset.row)+delta[0])+'_'+(Number(cell.dataset.col)+delta[1]));
  if(next){e.preventDefault();next.focus();next.select();}
 });});
}
function TGSyncCrossLocked(){
 if(TG.kind!=='crossword'||!TG.placements)return;
 TG.placements.forEach(function(p){
  if(State[p.item]&&State[p.item].AnsweredCorrectly){
   var cells=TGCrossCells(p);
   cells.forEach(function(cell,k){
    if(cell&&TG.items[p.item].answer[0][k]){
     cell.value=TG.items[p.item].answer[0][k];
     cell.readOnly=true;
     cell.parentElement.classList.add('cross-correct');
    }
   });
  }
 });
}`;
