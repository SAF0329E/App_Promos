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
 rows.forEach(r=>{const n=Number(r.units);const code=String(r.code||"").replace(/^\*/,"").trim();if(!code||!n)return;
   if(promos[code]) promos[code].forEach(([q,d])=>map.set(d,(map.get(d)||0)+q*n));
    else {const d=(r.description||PRODUCTS[code]||"Producto no identificado").trim();map.set(d,(map.get(d)||0)+n)}
 });
 lastTotals=[...map].map(([description,units])=>({description,units}));
 $("#totals").classList.toggle("empty",!lastTotals.length);
 $("#totals").innerHTML=lastTotals.length?lastTotals.map(x=>`<div class="total-line"><span>${esc(x.description)}</span><b>${x.units}</b></div>`).join(""):"Aún no hay líneas calculadas.";
 return lastTotals;
}
function parseOCR(text){
  const found=[];
  for(const line of text.split(/\r?\n/)){
    const clean=line.replace(/[|]/g," ").replace(/\s+/g," ").trim();
    const m=clean.match(/[*]?\s*(\d{3,5})(?:\s+(.+?))?\s+(\d{1,5})\s*$/);
    if(m){
      const code=m[1], description=(m[2]||PRODUCTS[code]||"").trim();
      found.push({code,units:m[3],description,unknown:!description});
    } else {
      const fallback=clean.match(/^(.+?)\s+(\d{1,5})\s*$/);
      if(fallback)found.push({code:"",description:fallback[1].trim(),units:fallback[2],unknown:false});
    }
  }
  return found;
}
async function readPhoto(file){
 $("#readerState").hidden=false;$("#readerState").textContent="Leyendo imagen…";
 const config=JSON.parse(localStorage.getItem("bodega-config")||"{}");
 if(navigator.onLine&&config.apiKey){
    try{rows=await visionRead(file,config);if(!rows.length)throw Error("No se encontraron filas");$("#readerState").textContent="Lectura con visión completada.";renderRows();calculate();return}catch(e){toast("No se pudo usar la visión; se intentará lectura local.")}
 }
 $("#offlineNotice").hidden=false;
 try{
   if(!window.Tesseract)throw Error("Tesseract no disponible");
   const result=await Tesseract.recognize(file,"spa",{logger:m=>{if(m.status)$("#readerState").textContent=`Lectura local: ${Math.round((m.progress||0)*100)}%`;}});
   rows=parseOCR(result.data.text);if(!rows.length)rows=[{code:"",description:"",units:"",unknown:false}];
   renderRows();calculate();$("#readerState").textContent="Lectura local terminada.";
 }catch(e){rows=[{code:"",description:"",units:"",unknown:false}];renderRows();toast("Escribe las líneas manualmente.")}
}
async function visionRead(file,config){
 const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file)});
 if(config.provider==="anthropic")throw Error("Claude requiere un proxy seguro");
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${config.apiKey}`},body:JSON.stringify({model:"gpt-4o-mini",response_format:{type:"json_object"},messages:[{role:"system",content:"Lee un informe de productos. Devuelve únicamente JSON con el formato {rows:[{code:string,description:string,units:number}]}. Extrae el nombre completo del producto y sus unidades. El código es opcional y solo sirve para reconocer promociones. Ignora tachaduras y marcas rojas o azules. No inventes datos."},{role:"user",content:[{type:"text",text:"Lee el nombre del producto y las unidades de cada fila. Si hay una promoción, conserva el nombre de la línea y su cantidad."},{type:"image_url",image_url:{url:`data:${file.type};base64,${data}`}}]}]})});
  if(!response.ok)throw Error("API");
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
 ["cameraInput","galleryInput"].forEach(id=>$("#"+id).onchange=e=>e.target.files[0]&&readPhoto(e.target.files[0]));
 $("#addPromo").onclick=()=>{let c="nuevo";let n=1;while(promos[c])c=`nuevo${n++}`;promos[c]=[[1,"Nuevo producto"]];savePromos();renderPromos()};
 $("#exportPromos").onclick=()=>{const blob=new Blob([JSON.stringify(promos,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="promociones-bodega.json";a.click();URL.revokeObjectURL(a.href)};
 $("#importPromos").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||Array.isArray(x)||typeof x!=="object")throw Error();promos=x;savePromos();renderPromos();toast("Promociones importadas")}catch{toast("Archivo inválido")}};r.readAsText(f)};
 const cfg=JSON.parse(localStorage.getItem("bodega-config")||"{}");$("#provider").value=cfg.provider||"openai";$("#apiKey").value=cfg.apiKey||"";$("#saveConfig").onclick=()=>{localStorage.setItem("bodega-config",JSON.stringify({provider:$("#provider").value,apiKey:$("#apiKey").value.trim()}));$("#configSaved").hidden=false};
 const update=()=>{$("#network").textContent=navigator.onLine?"● En línea":"● Sin conexión";$("#network").classList.toggle("offline",!navigator.onLine)};addEventListener("online",update);addEventListener("offline",update);update();
 rows=[{code:"",description:"",units:"",unknown:false}];renderRows();renderPromos();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
}
setup();
