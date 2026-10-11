/* ============================================================
   Галактика «Учебные проекты» — вторая галактика космоса УП.
   Работает поверх механики index.html через мост UNI.
   Уровни: 'pgalaxy' (планеты) и 'project' (модель проекта).
   ============================================================ */
window.PGX=(function(){
'use strict';
var PROJX=window.PROJX;
var COL=0x7fe3a0;                  /* цвет учебной галактики */
var AXISC={need:0x93a7b8,goal:0xe8f6ff,result:0x7fd4c8,outcome:0x9fd8ff,benefit:0xffe08a,value:0xffd166};
var KINDC={csf:0xf472b6,sc:0x9fd8ff,metric:0x7fe3a0,req:0x7fd4c8,risk:0xf87171,dep:0x8aa0b8,owner:0xcbd5e1,opp:0x7fe3a0};
var KINDRU={need:'потребность',goal:'цель',result:'результат',outcome:'использование',benefit:'выгода',value:'ценность',
 csf:'критический фактор успеха',sc:'критерий успеха',metric:'KPI / измеритель',req:'требование',risk:'риск',
 dep:'зависимость / ограничение / допущение',owner:'владелец',scope:'граница проекта',opp:'возможность'};
var AXIS_L={need:1,goal:1,result:1,outcome:2,benefit:2,value:2,scope:3,sc:4,csf:5,metric:6,req:7,risk:8,dep:8,owner:8,opp:8};
var CONFRU={a:'подтверждено источником',b:'вероятная интерпретация',c:'требует уточнения'};
var maxLayer=8, hidden=new Set(), cmpSet=new Set();
function U(){return window.UNI;}
function V3(x,y,z){return new THREE.Vector3(x,y,z);}
function byId(pid){return PROJX.projects.filter(function(p){return p.id===pid;})[0];}
function confBadge(c){if(!c)return'';return '<span class="badge conf-'+c+'">'+CONFRU[c]+'</span>';}
function stBadge(st){return st==='e'?'<span class="badge conf-a">подтверждено</span>':st==='l'?'<span class="badge conf-b">следует из описания</span>':'<span class="badge conf-c">предполагается</span>';}

/* ---------- мини-галактика на общем виде: четвёртая (внешняя) орбита ---------- */
var GAL_ORBIT={R:192,y0:6,i:.06,spd:.02,ph:5.9};
function mini(){
  var u=U(),gp=new THREE.Group();
  u.ORBITS.pgal=GAL_ORBIT;u.sphGrps.pgal=gp; /* движется тем же орбитальным циклом, что и сферы */
  u.sphOrbitPos('pgal',GAL_ORBIT.ph,gp.position);u.world.add(gp);
  /* видимое кольцо-орбита галактики */
  var og=new THREE.Group();og.position.set(u.SUN_POS.x,u.SUN_POS.y+GAL_ORBIT.y0,u.SUN_POS.z);og.rotation.x=GAL_ORBIT.i;
  var tr=u.ring(GAL_ORBIT.R,.09,COL,.18);tr.rotation.x=Math.PI/2;og.add(tr);u.world.add(og);
  var sh=u.shell(15,COL);gp.add(sh);
  var wire=new THREE.Mesh(new THREE.SphereGeometry(15,18,12),new THREE.MeshBasicMaterial({color:COL,wireframe:true,transparent:true,opacity:.06}));gp.add(wire);
  var pl=new THREE.PointLight(COL,.7,50);gp.add(pl);
  var core=u.orb(1.3,COL,.7);gp.add(core);
  var hit=new THREE.Mesh(new THREE.SphereGeometry(16,8,6),new THREE.MeshBasicMaterial({visible:false}));gp.add(hit);
  u.reg(hit,'pgal',{title:'Галактика «Учебные проекты»',code:'демо-набор · 5 проектов',css:'prj',
    what:'Вторая галактика космоса управления проектами: вымышленные учебные проекты, разобранные по модели ICB — потребность → цель → результат → использование → выгода → ценность.',
    doesLabel:'Что внутри',does:['5 планет-проектов с периодами, ролями и бюджетами','Причинная ось и граница проекта внутри каждой','КФУ, критерии успеха, KPI, требования, риски и владельцы','ICB-карта каждого проекта и переходы к элементам стандарта'],
    example:'Откройте планету — по шагам включайте слои модели от оси до поля рисков.',
    mistake:'Читать проект списком фактов — смысл в отношениях между сущностями.',
    src:'демо-набор данных (вымысел) — см. «Покрытие»'});
  u.addLabel(function(){return gp.position.clone();},'pgal','УЧЕБНЫЕ ПРОЕКТЫ','ДЕМО-НАБОР · 5 ПРОЕКТОВ','prj',{prio:0});
  PROJX.projects.forEach(function(p,i){
    var a=i/PROJX.projects.length*Math.PI*2-Math.PI/2;
    var r=1+Math.sqrt(parseInt(p.budget.replace(/\D/g,''))||20)/11;
    var m=u.orb(r,COL,.7); m.position.set(Math.cos(a)*10.5,Math.sin(i*1.9)*3,Math.sin(a)*10.5); gp.add(m);
    u.reg(m,'prj-'+p.id,planetInfo(p));
    u.addLabel(function(){return gp.position.clone().add(m.position);},'prj-'+p.id,p.name,p.period.split('(')[0].trim(),'prj',{prio:3,maxDist:150});
    /* связи с топ-элементами ICB на общем виде — только при выборе */
    p.icb.filter(function(x){return x.st==='e';}).slice(0,3).forEach(function(x){
      var tp=u.compPosOf(x.code); if(!tp)return;
      var l=u.mkLink(gp.position.clone().add(m.position),tp,'related',COL); u.linkEnds(l,'prj-'+p.id,'comp-'+x.code);
      if(u.linkDyn)u.linkDyn(l,function(){return gp.position.clone().add(m.position);},function(){return u.compPosOf(x.code);});
    });
  });
}

/* ---------- полная галактика (уровень pgalaxy) ---------- */
function buildGalaxy(){
  var u=U(),c=new THREE.Vector3(0,2,0);hidden.clear();cmpSet.clear();
  var sh=u.shell(19,COL);sh.position.copy(c);u.world.add(sh);
  var wire=new THREE.Mesh(new THREE.SphereGeometry(19,18,12),new THREE.MeshBasicMaterial({color:COL,wireframe:true,transparent:true,opacity:.05}));wire.position.copy(c);u.world.add(wire);
  u.world.add(groundGridLite(90));
  var pl=new THREE.PointLight(COL,1,80);pl.position.set(0,16,10);u.world.add(pl);
  var core=u.orb(1.8,COL,.8);core.position.copy(c);u.world.add(core);
  u.reg(core,'pgal',infoRegPgal());
  u.addLabel(function(){return c.clone().add(V3(0,3.4,0));},'pgal','УЧЕБНЫЕ ПРОЕКТЫ','галактика учебных примеров','prj',{prio:0});
  PROJX.projects.forEach(function(p,i){
    var a=i/PROJX.projects.length*Math.PI*2-Math.PI/2;
    var pv=V3(Math.cos(a)*13,2+Math.sin(i*1.9)*2.4,Math.sin(a)*13);
    var r=1.5+Math.sqrt(parseInt(p.budget.replace(/\D/g,''))||20)/9;
    var g=new THREE.Group();g.position.copy(pv);u.world.add(g);
    var m=u.orb(r,COL,.75);g.add(m);
    if(p.type==='procurement-demo'){var rr=u.ring(r*1.7,.07,COL,.5);rr.rotation.x=Math.PI/2.4;g.add(rr);} /* кольцо = учебный закупочный проект */
    u.reg(m,'prj-'+p.id,planetInfo(p));
    var l=u.mkLink(c,pv,'contains',COL);u.linkEnds(l,'pgal','prj-'+p.id);l.show=true;l.line.visible=true;
    u.addLabel(function(){return g.position.clone().add(V3(0,r+1.8,0));},'prj-'+p.id,p.name.toUpperCase(),p.period.split('(')[0].trim()+' · '+p.role,'prj',{prio:1});
  });
  u.fly(.4,.28,64,c);
}
function infoRegPgal(){
  return {title:'Галактика «Учебные проекты»',code:'демо-набор · 5 проектов',css:'prj',
    what:'Вымышленные учебные проекты как планеты: размер ∝ бюджету, кольцо — учебный закупочный проект. Внутри каждой — смысловая модель проекта по ICB.',
    doesLabel:'Состав',does:PROJX.projects.map(function(p){return p.name+' — '+p.role+', '+p.period;}),
    example:'Размер планеты — масштаб бюджета; кольцо — учебный закупочный проект.',
    mistake:'Считать размер планеты оценкой «крутости» проекта — это бюджет, не важность.',
    src:PROJX.sources.length+' источников — реестр в панели «Покрытие»',
    extra:srcList()};
}
function srcList(){
  return '<h3>Реестр источников</h3><ul class="srcs">'+PROJX.sources.map(function(s){
    return '<li><b>'+s.t+'</b> · '+s.has+'<br><code>'+s.p+'</code> '+confBadge(s.conf)+'</li>';}).join('')+'</ul>';
}
function planetInfo(p){
  var h='<h3>Факты проекта</h3><ul>'+
    '<li><b>Период:</b> '+p.period+' '+confBadge(p.periodConf)+'</li>'+
    '<li><b>Роль:</b> '+p.role+'</li>'+
    '<li><b>Организация:</b> '+p.org+'</li>'+
    '<li><b>Бюджет:</b> '+p.budget+' '+confBadge(p.budgetConf)+'</li>'+
    '<li><b>Команда:</b> '+p.team+'</li>'+
    '<li><b>Тип:</b> '+p.type+'</li></ul>';
  if(p.note)h+='<h3>Оговорки по данным</h3><p>'+p.note+'</p>';
  h+='<h3>ICB-карта проекта</h3><div class="icbmap">'+p.icb.map(function(x){
    var cd=U().CD[x.code];return '<button class="icbchip" data-toicb="'+x.code+'" title="'+x.ev+'">'+x.code+' '+(cd?cd.name:'')+' '+stBadge(x.st)+'</button>';}).join('')+'</div>';
  h+='<h3>Урок проекта</h3><p>'+p.lesson+'</p>';
  h+='<h3>Источники проекта</h3><ul>'+p.src.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ul>';
  return {title:p.name,code:p.period+' · '+p.role,css:'prj',
    what:'Планета проекта «'+p.short+'»: '+p.type+' в '+p.org+'. Внутри — полная модель: причинная ось, граница проекта, КФУ, критерии, KPI, требования, риски и владельцы.',
    doesLabel:'Ключевой результат',does:p.axis[2].x+'. '+p.axis[4].x+'.',
    example:'Нажмите «Открыть модель проекта» — слои можно включать по шагам как учебный кейс.',
    mistake:'Видеть в проекте только сроки и бюджет — за ними стоят выгода, владельцы и условия успеха.',
    src:p.src.join(' · '),extra:h};
}

/* ---------- внутренность проекта (уровень project) ---------- */
var AXPOS={need:[-33,4,0],goal:[-19.5,4,0],result:[-6,4,0],outcome:[7.5,4,0],benefit:[20,4,0],value:[32,4,0]};
function buildProject(pid){
  var u=U(),p=byId(pid);maxLayer=8;hidden.clear();cmpSet.clear();
  u.world.add(groundGridLite(110));
  var pl=new THREE.PointLight(0xeaf6ff,.9,120);pl.position.set(0,26,18);u.world.add(pl);
  var nodes={}; /* axis-id -> mesh, entity-id -> mesh */
  /* --- причинная ось --- */
  p.axis.forEach(function(a,i){
    var pos=AXPOS[a.id],m;
    if(a.id==='result')m=u.box(3.4,3.4,3.4,AXISC[a.id],.3);
    else if(a.id==='outcome'){m=new THREE.Mesh(new THREE.TorusGeometry(2.3,.5,12,40),new THREE.MeshStandardMaterial({color:AXISC[a.id],emissive:AXISC[a.id],emissiveIntensity:.45,roughness:.4}));}
    else if(a.id==='benefit'||a.id==='value')m=u.beacon(a.id==='benefit'?2:2.4,AXISC[a.id]);
    else m=u.orb(a.id==='goal'?2.3:2,AXISC[a.id],.6);
    m.position.set(pos[0],pos[1],pos[2]);u.world.add(m);
    nodes[a.id]=m;
    var id='pe-'+pid+'-ax-'+a.id;
    u.reg(m,id,entInfo(pid,'axis',a.id,a,i));
    m.userData.pgType=a.id;m.userData.pgLayer=AXIS_L[a.id];
    u.addLabel(function(){return m.position.clone().add(V3(0,3.6,0));},id,a.x.length>52?a.x.slice(0,50)+'…':a.x,KINDRU[a.id].toUpperCase()+(a.conf?' · '+CONFRU[a.conf]:''),'prj',{prio:1,pgLayer:AXIS_L[a.id],pgType:a.id});
    if(i>0){var prev=nodes[p.axis[i-1].id];var lk=u.mkLink(prev.position.clone(),m.position.clone(),'influence');u.linkEnds(lk,'pe-'+pid+'-ax-'+p.axis[i-1].id,id);lk.show=true;lk.line.visible=true;}
  });
  /* --- граница проекта (слой 3) --- */
  var rc=nodes.result.position;
  var bs=u.shell(10.5,AXISC.result);bs.position.copy(rc);u.world.add(bs);
  bs.userData.pgLayer=3;
  var bw=new THREE.Mesh(new THREE.SphereGeometry(10.5,20,14),new THREE.MeshBasicMaterial({color:AXISC.result,wireframe:true,transparent:true,opacity:.08}));bw.position.copy(rc);u.world.add(bw);bw.userData.pgLayer=3;
  var bsid='pe-'+pid+'-scope';
  u.reg(bs,bsid,entInfo(pid,'misc','scope',{x:'Внутри — то, чем проект управляет и что обязан поставить. Снаружи — outcome, выгода и всё, что предоставляет заказчик.'},0));
  u.addLabel(function(){return rc.clone().add(V3(0,12,0));},bsid,'ГРАНИЦА ПРОЕКТА','внутри — зона поставки · снаружи — мир заказчика','prj',{prio:0,pgLayer:3});
  /* inside-scope chips на поверхности */
  p.scopeIn.forEach(function(s,i){
    var a=i/p.scopeIn.length*Math.PI*2;
    var m=u.box(1.1,1.1,1.1,AXISC.result,.35);m.position.set(rc.x+Math.cos(a)*6.5,rc.y+Math.sin(i*2.3)*4,rc.z+Math.sin(a)*6.5);u.world.add(m);
    var id='pe-'+pid+'-sin-'+i;
    u.reg(m,id,entInfo(pid,'misc','scope-in',{x:s},i));
    m.userData.pgLayer=3;
    u.addLabel(function(){return m.position.clone().add(V3(0,1.4,0));},id,s.length>44?s.slice(0,42)+'…':s,'внутри границы','prj',{prio:3,pgLayer:3});
  });
  p.scopeOut.forEach(function(s,i){
    var m=u.box(1.3,.7,1.3,0x64748b,.12);m.position.set(rc.x-16+i*6.2,-7.5,12);u.world.add(m);
    var id='pe-'+pid+'-sout-'+i;
    u.reg(m,id,entInfo(pid,'misc','scope-out',{x:s},i));
    m.userData.pgLayer=3;
    u.addLabel(function(){return m.position.clone().add(V3(0,1.2,0));},id,s.length>40?s.slice(0,38)+'…':s,'за границей проекта','prj dim',{prio:3,pgLayer:3});
    var lk=u.mkLink(m.position.clone(),rc.clone(),'related');u.linkEnds(lk,id,bsid);lk.pgLayer=3;
  });
  /* --- КФУ: орбита вокруг оси (слой 5) --- */
  var cc=V3(-2,4,0);
  p.csf.forEach(function(f,i){
    var a=i/p.csf.length*Math.PI*2+.4;
    var m=new THREE.Mesh(new THREE.OctahedronGeometry(1.3,0),new THREE.MeshStandardMaterial({color:KINDC.csf,emissive:KINDC.csf,emissiveIntensity:.5,wireframe:false,roughness:.4}));
    m.position.set(cc.x+Math.cos(a)*10.5,cc.y+Math.sin(i*2.1)*2.5+3.5,cc.z+Math.sin(a)*10.5);u.world.add(m);
    var id='pe-'+pid+'-csf-'+i;
    u.reg(m,id,entInfo(pid,'csf',null,f,i));
    m.userData.pgType='csf';m.userData.pgLayer=5;
    f.on.forEach(function(t){var tn=nodes[t];if(!tn)return;var lk=u.mkLink(m.position.clone(),tn.position.clone(),'influence');lk.line.material.color.setHex(KINDC.csf);u.linkEnds(lk,id,'pe-'+pid+'-ax-'+t);lk.show=true;lk.line.visible=true;lk.pgLayer=5;});
    u.addLabel(function(){return m.position.clone().add(V3(0,1.9,0));},id,'КФУ · '+f.t.length>38?('КФУ · '+f.t).slice(0,40)+'…':'КФУ · '+f.t,f.ctrl?'под контролем PM':'вне прямого контроля PM','prj csf',{prio:2,pgLayer:5,pgType:'csf'});
  });
  /* --- критерии успеха: флаги у целевых узлов (слой 4) --- */
  p.sc.forEach(function(s,i){
    var tn=nodes[s.on];if(!tn)return;
    var m=new THREE.Mesh(new THREE.ConeGeometry(.8,1.9,8),new THREE.MeshStandardMaterial({color:KINDC.sc,emissive:KINDC.sc,emissiveIntensity:.55,roughness:.4}));
    m.position.set(tn.position.x-2+i*1.6,tn.position.y+4.8,tn.position.z-1.5);m.rotation.z=.2;u.world.add(m);
    var id='pe-'+pid+'-sc-'+i;
    u.reg(m,id,entInfo(pid,'sc',null,s,i));
    m.userData.pgType='sc';m.userData.pgLayer=4;
    var lk=u.mkLink(m.position.clone(),tn.position.clone(),'contains',KINDC.sc);u.linkEnds(lk,id,'pe-'+pid+'-ax-'+s.on);lk.show=true;lk.line.visible=true;lk.pgLayer=4;
    u.addLabel(function(){return m.position.clone().add(V3(0,1.5,0));},id,'КУ · '+s.t.length>36?('КУ · '+s.t).slice(0,38)+'…':'КУ · '+s.t,'критерий успеха','prj',{prio:2,pgLayer:4,pgType:'sc'});
  });
  /* --- KPI: измерители под целевыми узлами (слой 6) --- */
  p.metrics.forEach(function(mt,i){
    var tn=nodes[mt.on];if(!tn)return;
    var g=new THREE.Group();g.position.set(tn.position.x-1.5+(i%3)*1.8,tn.position.y-4.6-Math.floor(i/3)*1.8,tn.position.z+1.5);u.world.add(g);
    var m=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.8,14),new THREE.MeshStandardMaterial({color:KINDC.metric,emissive:KINDC.metric,emissiveIntensity:.4,roughness:.5}));
    g.add(m);
    var nd=new THREE.Mesh(new THREE.BoxGeometry(.12,1.3,.12),new THREE.MeshStandardMaterial({color:0xeaf6ff,emissive:0xeaf6ff,emissiveIntensity:.5}));nd.position.y=.9;g.add(nd);
    var id='pe-'+pid+'-m-'+i;
    u.reg(g,id,entInfo(pid,'metric',null,mt,i));
    g.userData.pgType='metric';g.traverse(function(o){o.userData.pgLayer=6;});
    var lk=u.mkLink(g.position.clone(),tn.position.clone(),'contains',KINDC.metric);u.linkEnds(lk,id,'pe-'+pid+'-ax-'+mt.on);lk.show=true;lk.line.visible=true;lk.pgLayer=6;
    u.addLabel(function(){return g.position.clone().add(V3(0,-1.6,0));},id,'KPI · '+mt.t.length>30?('KPI · '+mt.t).slice(0,32)+'…':'KPI · '+mt.t,mt.v,'prj',{prio:2,pgLayer:6,pgType:'metric'});
  });
  /* --- требования: панели рядом с результатом (слой 7) --- */
  p.reqs.forEach(function(r,i){
    var m=u.box(2.6,1.5,.4,AXISC.result,.22);
    m.position.set(rc.x-4+(i%3)*4,rc.y+7+i%2*2,rc.z-6-Math.floor(i/3)*2.4);u.world.add(m);
    var id='pe-'+pid+'-req-'+i;
    u.reg(m,id,entInfo(pid,'req',null,r,i));
    m.userData.pgLayer=7;
    var lk=u.mkLink(m.position.clone(),rc.clone(),'contains',AXISC.result);u.linkEnds(lk,id,'pe-'+pid+'-ax-result');lk.show=true;lk.line.visible=true;lk.pgLayer=7;
    u.addLabel(function(){return m.position.clone().add(V3(0,1.3,0));},id,r.t.length>42?r.t.slice(0,40)+'…':r.t,'требование → результат','prj',{prio:3,pgLayer:7});
  });
  /* --- поле рисков (слой 8) --- */
  p.risks.forEach(function(r,i){
    var m=new THREE.Mesh(new THREE.TetrahedronGeometry(1.25,0),new THREE.MeshStandardMaterial({color:KINDC.risk,emissive:KINDC.risk,emissiveIntensity:.5,roughness:.4}));
    m.position.set(-30+ (i%4)*12, 13+Math.floor(i/4)*4, -14);m.userData.spin=1;u.world.add(m);
    var id='pe-'+pid+'-rk-'+i;
    u.reg(m,id,entInfo(pid,'risk',null,r,i));
    m.userData.pgType='risk';m.userData.pgLayer=8;
    (r.on||[]).forEach(function(t){var tn=nodes[t];if(!tn)return;var lk=u.mkLink(m.position.clone(),tn.position.clone(),'influence');lk.line.material.color.setHex(KINDC.risk);u.linkEnds(lk,id,'pe-'+pid+'-ax-'+t);lk.pgLayer=8;});
    u.addLabel(function(){return m.position.clone().add(V3(0,1.8,0));},id,'⚠ '+r.t.length>36?('⚠ '+r.t).slice(0,38)+'…':'⚠ '+r.t,'P'+'▮'.repeat(r.p)+' I'+'▮'.repeat(r.i),'prj risk',{prio:3,pgLayer:8});
  });
  /* --- зависимости/ограничения/допущения (слой 8) --- */
  p.field.forEach(function(f,i){
    var m=f.k==='ограничение'?u.box(3.4,.5,1.6,0x94a3b8,.15):f.k==='допущение'?u.orb(1,0x8aa0b8,.15):u.box(1.6,1.6,1.6,KINDC.dep,.15);
    if(f.k==='допущение'){m.material.transparent=true;m.material.opacity=.45;}
    m.position.set(-26+i*10.5,-8.5,-9);u.world.add(m);
    var id='pe-'+pid+'-dep-'+i;
    u.reg(m,id,entInfo(pid,'dep',null,f,i));
    m.userData.pgLayer=8;
    (f.on||[]).forEach(function(t){var tn=nodes[t];if(!tn)return;var lk=u.mkLink(m.position.clone(),tn.position.clone(),'related');u.linkEnds(lk,id,'pe-'+pid+'-ax-'+t);lk.pgLayer=8;});
    u.addLabel(function(){return m.position.clone().add(V3(0,1.5,0));},id,f.t.length>40?f.t.slice(0,38)+'…':f.t,f.k,'prj dim',{prio:3,pgLayer:8});
  });
  /* --- владельцы (слой 8) --- */
  p.owners.forEach(function(o,i){
    var g=u.person(0xcbd5e1,3.4);g.position.set(-24+i*12,-9,7);u.world.add(g);
    var id='pe-'+pid+'-own-'+i;
    u.reg(g,id,entInfo(pid,'owner',null,o,i));
    g.traverse(function(x){x.userData.pgLayer=8;});
    var tn=nodes[o.on];if(tn){var lk=u.mkLink(g.position.clone().add(V3(0,2.5,0)),tn.position.clone(),'contains',0xcbd5e1);u.linkEnds(lk,id,'pe-'+pid+'-ax-'+o.on);lk.show=true;lk.line.visible=true;lk.pgLayer=8;}
    u.addLabel(function(){return g.position.clone().add(V3(0,4,0));},id,o.who,o.what,'prj',{prio:2,pgLayer:8});
  });
  /* --- панель шагов и «не путать» --- */
  buildBar(p);
  u.fly(.35,.26,66,V3(0,3,0));
}
function groundGridLite(w){
  var g=new THREE.Group();
  var gh=new THREE.GridHelper(w,22,0x22344e,0x16233a);gh.material.transparent=true;gh.material.opacity=.4;gh.position.y=-11;g.add(gh);return g;
}

/* ---------- карточки сущностей ---------- */
function entInfo(pid,kind,axid,item,i){
  var p=byId(pid),defs=PROJX.entdefs;
  var tp=kind==='axis'?axid:kind==='dep'?'dep':kind==='misc'?'scope':kind;
  var d=defs[tp]||defs.dep;
  var concrete='',conf=null,ownTxt='',pmTxt=d.pm,notTxt=d.not;
  if(kind==='axis'){concrete=item.x;conf=item.conf;ownTxt=d.own;}
  else if(kind==='csf'){concrete='<b>'+item.t+'</b><br>'+item.why+'<br><b>Влияет на:</b> '+item.on.map(function(t){return KINDRU[t];}).join(', ');ownTxt=item.own+(item.ctrl?'':' · <b>вне прямого контроля PM</b>');pmTxt=item.pm;}
  else if(kind==='sc'){concrete='<b>'+item.t+'</b><br>Признак успеха для: «'+KINDRU[item.on]+'».';ownTxt='заказчик / приёмная сторона';}
  else if(kind==='metric'){concrete='<b>'+item.t+'</b><br>Значение: <b>'+item.v+'</b><br>Измеряет: «'+KINDRU[item.on]+'».';ownTxt=d.own;}
  else if(kind==='req'){concrete='<b>'+item.t+'</b>';ownTxt='источник требования — заказчик / стандарт';}
  else if(kind==='risk'){concrete='<b>'+item.t+'</b><br>Вероятность '+'▮'.repeat(item.p)+' · Влияние '+'▮'.repeat(item.i)+'<br><b>Стратегия:</b> '+item.strat;ownTxt=item.own;}
  else if(kind==='dep'){concrete='<b>'+item.t+'</b><br>Тип: '+item.k;ownTxt='сторона, от которой зависимость';}
  else if(kind==='owner'){concrete='<b>'+item.who+'</b><br>Владеет: '+item.what+' → «'+KINDRU[item.on]+'».';ownTxt=item.who;}
  else if(kind==='misc'&&tp==='scope'){concrete=item.x;ownTxt='РП + заказчик';}
  else if(kind==='misc'){concrete='<b>'+item.x+'</b>';ownTxt='—';}
  var h='';
  if(notTxt)h+='<h3>Почему это не другое понятие</h3><p>'+notTxt+'</p>';
  if(ownTxt)h+='<h3>Владелец</h3><p>'+ownTxt+'</p>';
  if(pmTxt)h+='<h3>Что может сделать руководитель проекта</h3><p>'+pmTxt+'</p>';
  return {title:(kind==='axis'?{need:'Потребность бизнеса',goal:'Цель проекта',result:'Результат / продукт',outcome:'Использование (outcome)',benefit:'Выгода',value:'Стратегическая ценность'}[axid]:(item.t||item.who||item.x||'')),
    code:'Проект «'+p.short+'» · '+KINDRU[tp],css:'prj',
    what:d.def,doesLabel:'На этом проекте',does:concrete,
    example:kind==='axis'&&axid==='result'?'Результат сдан ≠ выгода получена: смотрите цепочку вправо до «Использование».':'',
    mistake:'',src:p.src.slice(0,3).join(' · '),extra:h+(conf?('<p>'+confBadge(conf)+'</p>'):'')};
}

/* ---------- панель шагов + «не путать» ---------- */
function buildBar(p){
  var bar=document.getElementById('projbar');bar.classList.add('open');
  var STEPS=['Ось: потребность→результат','+ использование→выгода→ценность','+ граница проекта','+ критерии успеха','+ КФУ (условия)','+ KPI (измерители)','+ требования','+ риски · зависимости · владельцы'];
  var h='<b>Разобрать как учебный кейс:</b> ';
  for(var i=1;i<=8;i++)h+='<button data-step="'+i+'" class="'+(i===8?'on':'')+'">'+i+'. '+STEPS[i-1]+'</button>';
  h+='<button data-step="all">Все слои</button> ';
  h+='<span class="cmp"><b>Не путать:</b> '+['csf','sc','metric','result','benefit'].map(function(t){
    return '<button data-cmp="'+t+'">'+{csf:'КФУ',sc:'критерий',metric:'KPI',result:'результат',benefit:'выгода'}[t]+'</button>';}).join(' ')+'</span>';
  h+='<span class="lgnd">● КФУ · ◆ ось · ⚠ риск · ⚑ критерий · ⊙ KPI · ◼ требование · ♟ владелец</span>';
  bar.innerHTML=h;
  bar.querySelectorAll('[data-step]').forEach(function(b){
    b.onclick=function(){
      maxLayer=b.dataset.step==='all'?8:parseInt(b.dataset.step);
      bar.querySelectorAll('[data-step]').forEach(function(x){x.classList.toggle('on',x===b);});
      applyLayers();
    };
  });
  bar.querySelectorAll('[data-cmp]').forEach(function(b){
    b.onclick=function(){
      var t=b.dataset.cmp;
      if(cmpSet.has(t))cmpSet.delete(t);else cmpSet.add(t);
      b.classList.toggle('on',cmpSet.has(t));
      applyCompare();
    };
  });
}
function applyLayers(){
  var u=U();
  hidden.clear();
  u.world.traverse(function(o){
    var n=o.userData&&o.userData.pgLayer;
    if(n)o.visible=n<=maxLayer;
    if(o.userData&&o.userData.oid&&n&&n>maxLayer)hidden.add(o.userData.oid);
  });
  u.labels.forEach(function(l){l.pgLayerHide=l.pgLayer&&l.pgLayer>maxLayer;});
  u.links.forEach(function(l){l.pgLayerHide=l.pgLayer&&l.pgLayer>maxLayer;});
  u.refreshLinks();
}
function applyCompare(){
  var u=U(),on=cmpSet.size>0;
  u.world.traverse(function(o){
    var t=o.userData&&o.userData.pgType;
    if(o.isMesh&&t){
      var match=cmpSet.has(t);
      o.material.transparent=true;
      o.material.opacity=on&&!match?.12:(o.userData.op0!=null?o.userData.op0:1);
      if(o.userData.op0==null)o.userData.op0=1;
      if(on&&match)o.material.opacity=1;
    }
  });
  u.labels.forEach(function(l){
    l.el.classList.toggle('cmpdim',on&&l.pgType!=null&&!cmpSet.has(l.pgType));
    l.el.classList.toggle('hot',on&&cmpSet.has(l.pgType||''));
  });
}

/* ---------- блок «в учебных проектах» для карточек ICB ---------- */
function icbBlock(code){
  var hits=[];
  PROJX.projects.forEach(function(p){var m=p.icb.filter(function(x){return x.code===code;})[0];if(m)hits.push({p:p,st:m.st,ev:m.ev});});
  if(!hits.length)return'';
  return '<h3>В учебных проектах</h3><div class="icbmap">'+hits.map(function(x){
    return '<button class="icbchip prj" data-toprj="'+x.p.id+'" title="'+x.ev+'">'+x.p.name+' '+stBadge(x.st)+'</button>';}).join('')+'</div>';
}
function covBlock(){
  return '<br><b>ГАЛАКТИКА «УЧЕБНЫЕ ПРОЕКТЫ»</b> — источники (все данные вымышленные):<br>'+PROJX.sources.map(function(s){return '· '+s.t+' — <code>'+s.p+'</code><br>';}).join('');
}

return {COL:COL,mini:mini,buildGalaxy:buildGalaxy,buildProject:buildProject,icbBlock:icbBlock,covBlock:covBlock,
  applyLayers:applyLayers,get maxLayer(){return maxLayer;},get hidden(){return hidden;},planetInfo:planetInfo};
})();
