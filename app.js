const DEFAULT_PROMOS={
 "4551":[[12,"La Fina Mesa con Sal x 220 g"],[1,"Jabón Rey"]],
 "2132":[[3,"Deter Manz x 500"],[3,"Deter Rey x 500"],[1,"Deter Rey x 250"]],
 "4252":[[3,"Deter Rey x 250"],[3,"Deter Manz x 250"],[1,"Deter Rey x 125"]],
 "2001":[[3,"La Fina Barra x 125 (paquete x 4 und)"],[1,"Deter AS Manz x 125 g"]],
 "9619":[[6,"Deter Líquido Der+Rey x 400 ml"],[1,"Jabón Rey"]],
 "1219":[[6,"Deter Líquido Manz x 400 ml"],[1,"Jabón Rey"]],
 "2149":[[6,"Deter Manz x 1000"],[1,"Deter Manz x 500"]],
 "2150":[[6,"Deter Manz x 500"],[1,"Deter Rey x 250"]],
 "2151":[[6,"Deter Rey x 1000"],[1,"Deter Rey x 500"]],
 "1927":[[6,"Deter Rey x 125"],[6,"Deter Manz x 125"],[1,"Deter Rey x 125"]],
 "2152":[[6,"Deter Rey x 500"],[1,"Deter Rey x 250"]]
};
const PRODUCTS={"8889":"Bonif Megarollo Cliente Nuevo","21201":"Papel Hig Max Gruesito 4H x 6 und","21202":"Papel Hig Max Gruesito 4H x 6 und Paca x 8","2119":"Papel Hig Max Gruesito x 13","11030":"Papel Hig Max Gruesito x 26","11020":"Papel Hig Max Gruesito x 52","3018":"Papel Hig Mega s/empaque x 12","3012":"Papel Hig Mega x 13","3016":"Papel Hig Mega x 2","3017":"Papel Hig Mega x 4","3025":"Serv Popular x 200","3027":"Serv Popular x 300","30288":"Serv Popular x 600 Caja x 15","3029":"Toalla Cocina 3H x 50 hojas","8205":"Barra AS Bicarb y Manz x 250 g","8170":"Barra AS x 250 g"};
let promos=JSON.parse(localStorage.getItem("bodega-promos")||"null")||DEFAULT_PROMOS;
let rows=[], lastTotals=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function toast(text){const e=$("#toast");e.textContent=text;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)}
function savePromos(){localStorage.setItem("bodega-promos",JSON.stringify(promos))}
function productKey(name){
  return String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase()
    .replace(/\bDETERGENTE\b/g,"DETER").replace(/\bMANZANA\b/g,"MANZ")
    .replace(/\bGRS?\b|\bGRAMOS?\b|\bUNDS?\b|\bUNIDADES?\b|\bSOBRES?\b/g,"")
    .replace(/[^A-Z0-9]+/g," ").trim();
}
function renderRows(){
  const body=$("#inputRows");
  body.innerHTML=rows.map((r,i)=>`<tr class="${r.unknown?"unknown":""}">
  <td><input data-i="${i}" data-k="description" value="${esc(r.description||"")}" placeholder="Nombre del producto" aria-label="Producto"><input data-i="${i}" data-k="code" value="${esc(r.code||"")}" type="hidden"></td>
  <td><input data-i="${i}" data-k="units" value="${esc(r.units||"")}" type="number" min="0" inputmode="numeric" aria-label="Unidades"></td>
  <td><button class="remove" data-remove="${i}" aria-label="Eliminar">✕</button></td></tr>`).join("");
  body.querySelectorAll("input").forEach(x=>x.addEventListener("input",e=>{const r=rows[+e.target.dataset.i];r[e.target.dataset.k]=e.target.value;r.unknown=!r.description.trim();}));
  body.querySelectorAll("[data-remove]").forEach(x=>x.onclick=()=>{rows.splice(+x.dataset.remove,1);renderRows()});
}
function calculate(){
  const map=new Map();
  rows.forEach(r=>{const n=Number(r.units);const code=String(r.code||"").replace(/^\*/,"").trim();const description=(r.description||PRODUCTS[code]||"").trim();if(!n||(!code&&!description))return;
    const parts=description.split(/\s*\+\s*/).map(part=>part.trim()).filter(Boolean);
    const isWrittenPromo=parts.length>1&&parts.every(part=>/^\*?\s*\d+\s+.+/.test(part));
    if(isWrittenPromo){
      parts.forEach(part=>{
        const match=part.match(/^\*?\s*(\d+)\s+(.+)$/);
        if(match){
          const q=Number(match[1]),d=match[2].trim(),key=productKey(d),current=map.get(key);
          map.set(key,{description:current?.description||d,units:(current?.units||0)+q*n});
        }
      });
    } else if(promos[code]) promos[code].forEach(([q,d])=>{const key=productKey(d);const current=map.get(key);map.set(key,{description:current?.description||d,units:(current?.units||0)+q*n})});
    else {const d=description||"Producto no identificado";const key=productKey(d);const current=map.get(key);map.set(key,{description:current?.description||d,units:(current?.units||0)+n})}
  });
 lastTotals=[...map.values()];
 $("#totals").classList.toggle("empty",!lastTotals.length);
 $("#totals").innerHTML=lastTotals.length?lastTotals.map(x=>`<div class="total-line"><span>${esc(x.description)}</span><b>${x.units}</b></div>`).join(""):"Aún no hay líneas calculadas.";
 return lastTotals;
}
function parseOCR(text){
  const found=[];
  for(const line of text.split(/\r?\n/)){
    const clean=line.replace(/[|]/g," ").replace(/\s+/g," ").replace(/^(DIEGO|DIEG0)\s+/i,"").trim();
    const m=clean.match(/[*]?\s*(\d{3,5})(?:\s+(.+?))?\s+(\d{1,5})\s*$/);
    if(m){
      const code=m[1], description=(m[2]||PRODUCTS[code]||"").trim();
      if(description.length>=3&&/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(description)){
        found.push({code,units:m[3],description,unknown:false});
      }
    }
  }
  return found;
}
async function rotateForOCR(file,degrees=90){
  if(degrees===0)return file;
  const source=await createImageBitmap(file);
  const canvas=document.createElement("canvas");
  const sideways=degrees===90||degrees===270;
  canvas.width=sideways?source.height:source.width;
  canvas.height=sideways?source.width:source.height;
  const ctx=canvas.getContext("2d");
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.rotate(degrees*Math.PI/180);
  ctx.drawImage(source,-source.width/2,-source.height/2);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.95));
}
function ocrScore(items){
  return items.reduce((score,r)=>score+(r.code?5:0)+(r.description.trim().length>4?3:0)+(Number(r.units)>0?1:0),0);
}
function parseOCRLayout(data){
  const words=(data.words||[]).filter(w=>w.text&&Number(w.confidence??w.conf??0)>=0)
    .map(w=>({text:w.text.trim(),x:w.bbox?.x0||0,y:((w.bbox?.y0||0)+(w.bbox?.y1||0))/2}));
  const pageWidth=Number(data.width)||Math.max(...words.map(w=>w.x),1);
  const groups=[];
  words.sort((a,b)=>a.y-b.y||a.x-b.x).forEach(word=>{
    let row=groups.find(g=>Math.abs(g.y-word.y)<18);
    if(!row){row={y:word.y,words:[]};groups.push(row)}
    row.words.push(word);
  });
  return groups.map(row=>{
    const tokens=row.words.sort((a,b)=>a.x-b.x).map(w=>w.text);
    const codeIndex=row.words.findIndex(w=>w.x<pageWidth*.35&&/^\*?\d{3,5}$/.test(w.text.replace(/[^\d*]/g,"")));
    if(codeIndex<0)return null;
    const code=row.words[codeIndex].text.replace(/[^\d]/g,"");
    const unitIndex=row.words.map((w,i)=>({w,i})).reverse()
      .find(({w,i})=>i>codeIndex&&w.x>pageWidth*.45&&/^\d{1,5}$/.test(w.text.replace(/[^\d]/g,"")) )?.i;
    if(unitIndex==null)return null;
    const description=tokens.slice(codeIndex+1,unitIndex)
      .filter(t=>!/^(EDISSON|DIEGO|DIEG0)$/i.test(t)).join(" ").trim();
    if(description.length<3)return null;
    return {code,description,units:tokens[unitIndex].replace(/[^\d]/g,""),unknown:false};
  }).filter(Boolean);
}
async function readOCRInBestOrientation(file){
  let best={rows:[],score:-1};
  for(const degrees of [0,90,180,270]){
    const image=await rotateForOCR(file,degrees);
    const result=await Tesseract.recognize(image,"spa",{tessedit_pageseg_mode:"6",preserve_interword_spaces:"1",logger:m=>{
      if(m.status)$("#readerState").textContent=`Revisando orientación ${degrees}°: ${Math.round((m.progress||0)*100)}%`;
    }});
    const candidate=parseOCRLayout(result.data);
    const score=ocrScore(candidate);
    if(score>best.score)best={rows:candidate,score};
  }
  return best.rows;
}
async function readPhoto(file,append=false){
 $("#readerState").hidden=false;$("#readerState").textContent="Leyendo imagen…";
 const config=JSON.parse(localStorage.getItem("bodega-config")||"{}");
 if(navigator.onLine&&config.apiKey)try{
   const parsed=await visionRead(file,config);
   if(!parsed.length)throw Error("No se encontraron filas");
   rows=append?rows.concat(parsed):parsed;
   renderRows();calculate();$("#readerState").textContent="Lectura con visión completada.";
 }catch(e){
   toast("La visión no respondió; se intentará lectura local.");
 }
 try{
   if(!window.Tesseract)throw Error("Tesseract no disponible");
   const parsed=await readOCRInBestOrientation(file);
   if(!parsed.length)throw Error("No se encontraron filas");
   rows=append?rows.concat(parsed):parsed;
   renderRows();calculate();$("#readerState").textContent="Lectura local terminada; revisa los nombres y unidades.";
 }catch(e){
   $("#readerState").textContent="No se pudo leer la imagen. Puedes agregar las líneas manualmente.";
   toast("No se encontraron datos legibles.");
 }
}
async function readPhotos(files){
  rows=[];lastTotals=[];renderRows();
  for(const file of files)await readPhoto(file,true);
  calculate();
}
async function visionRead(file,config){
 const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file)});
 if(config.provider==="anthropic")throw Error("Claude requiere un proxy seguro");
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${config.apiKey}`},body:JSON.stringify({model:"gpt-4o-mini",response_format:{type:"json_object"},messages:[{role:"system",content:"Lee una tabla de pedidos que puede estar girada. Sus columnas son Code, Description y UNIDADES. Devuelve únicamente JSON con el formato {rows:[{code:string,description:string,units:number}]}. El campo units DEBE ser exclusivamente el número de la columna UNIDADES, que está al extremo derecho de cada fila. Nunca uses números que formen parte de la descripción, como x 300, x 400 ml, x 12 und, 4H x 6 und o 450 GRS. Esos números describen el contenido o tamaño del producto, no la cantidad pedida. El código solo sirve internamente para reconocer promociones y no debe aparecer en la descripción. Ignora tachaduras y marcas rojas o azules. No inventes datos."},{role:"user",content:[{type:"text",text:"Gira mentalmente la foto si es necesario. Lee cada fila completa: nombre exacto de Description y el número final de la columna UNIDADES. Si una fila corresponde a una promoción, units es cuántas veces se pidió esa promoción; después el programa multiplicará todos sus productos por esa cantidad."},{type:"image_url",image_url:{url:`data:${file.type};base64,${data}`}}]}]})});
  if(!response.ok){
    let detail="";
    try{const error=await response.json();detail=error?.error?.message||""}catch{}
    throw Error(`API ${response.status}${detail?`: ${detail}`:""}`);
  }
  const json=await response.json();const parsed=JSON.parse(json.choices[0].message.content);
  return (parsed.rows||[]).map(r=>{const code=String(r.code||"").trim();const description=String(r.description||PRODUCTS[code]||"").trim();return {code,description,units:String(r.units??""),unknown:!description}});
}
function renderPromos(){
 $("#promoEditor").innerHTML=Object.entries(promos).map(([code,items])=>`<div class="promo" data-promo="${esc(code)}"><div class="promo-head"><b>Código</b><input class="pcode" value="${esc(code)}"><button class="remove delpromo">Eliminar</button></div><div class="items">${items.map((it,j)=>`<div class="promo-item"><input class="qty" type="number" min="0" value="${it[0]}"><input class="desc" value="${esc(it[1])}"><button class="remove delitem" data-j="${j}">✕</button></div>`).join("")}</div><button class="button small secondary additem">＋ Producto</button></div>`).join("");
 $("#promoEditor").querySelectorAll(".promo").forEach(card=>{const old=card.dataset.promo;card.querySelector(".pcode").onchange=e=>{const next=e.target.value.trim();if(next&&next!==old){promos[next]=promos[old];delete promos[old];savePromos();renderPromos()}};card.querySelectorAll(".qty,.desc").forEach(x=>x.onchange=()=>{const i=[...card.querySelectorAll(".promo-item")].indexOf(x.closest(".promo-item"));promos[old][i]=[Number(card.querySelectorAll(".qty")[i].value)||0,card.querySelectorAll(".desc")[i].value];savePromos()});card.querySelector(".delpromo").onclick=()=>{delete promos[old];savePromos();renderPromos()};card.querySelector(".additem").onclick=()=>{promos[old].push([1,"Nuevo producto"]);savePromos();renderPromos()};card.querySelectorAll(".delitem").forEach(b=>b.onclick=()=>{promos[old].splice(+b.dataset.j,1);savePromos();renderPromos()})});
}
function setup(){
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.view").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.view).classList.add("active")});
 $("#addRow").onclick=()=>{rows.push({code:"",description:"",units:"",unknown:false});renderRows()};
 $("#calculate").onclick=calculate;$("#newReport").onclick=()=>{rows=[];lastTotals=[];$("#offlineNotice").hidden=true;$("#readerState").hidden=true;renderRows();calculate()};
 $("#copyResult").onclick=async()=>{const text=lastTotals.map(x=>`${x.units} ${x.description}`).join("\n");if(!text)return toast("Primero calcula un total");await navigator.clipboard.writeText(text);toast("Resultado copiado")};
  ["cameraInput","galleryInput"].forEach(id=>$("#"+id).onchange=e=>e.target.files.length&&readPhotos([...e.target.files]));
 $("#addPromo").onclick=()=>{let c="nuevo";let n=1;while(promos[c])c=`nuevo${n++}`;promos[c]=[[1,"Nuevo producto"]];savePromos();renderPromos()};
 $("#exportPromos").onclick=()=>{const blob=new Blob([JSON.stringify(promos,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="promociones-bodega.json";a.click();URL.revokeObjectURL(a.href)};
 $("#importPromos").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||Array.isArray(x)||typeof x!=="object")throw Error();promos=x;savePromos();renderPromos();toast("Promociones importadas")}catch{toast("Archivo inválido")}};r.readAsText(f)};
 const cfg=JSON.parse(localStorage.getItem("bodega-config")||"{}");$("#provider").value=cfg.provider||"openai";$("#apiKey").value=cfg.apiKey||"";$("#saveConfig").onclick=()=>{localStorage.setItem("bodega-config",JSON.stringify({provider:$("#provider").value,apiKey:$("#apiKey").value.trim()}));$("#configSaved").hidden=false};
 const update=()=>{$("#network").textContent=navigator.onLine?"● En línea":"● Sin conexión";$("#network").classList.toggle("offline",!navigator.onLine)};addEventListener("online",update);addEventListener("offline",update);update();
 rows=[{code:"",description:"",units:"",unknown:false}];renderRows();renderPromos();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
}
setup();
