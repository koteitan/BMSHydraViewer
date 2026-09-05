Array.prototype.min=function(){
  var min=this[0];
  for(var i=1;i<this.length;i++){
    if(this[i]<min)min=this[i];
  }
  return min;
}
Array.prototype.max=function(){
  var max=this[0];
  for(var i=1;i<this.length;i++){
    if(this[i]>max)max=this[i];
  }
  return max;
}
//matrix
function Matrix(matrix){
  this.matrix=matrix;
  this.columns=matrix.length;
  this.rows=matrix[0].length;
}
Matrix.prototype.toString=function (){
  str="";
  for(var x=0;x<this.columns;x++){
    str+="(";
    for(var y=0;y<this.rows;y++){
      str+=this.get(x,y);
      if(y!=this.rows-1) str+=",";
    }
    str+=")";
  }
  return str;
}
Matrix.prototype.get=function (x,y){
  return this.matrix[x][y];
}
Matrix.prototype.lowermostNonzero=function (){
  for (var i=0;i<this.rows;i++){
    if (!this.get(this.columns-1,i)){
      return i-1;
    }
  }
  return this.rows-1;
}
Matrix.prototype.getParent=function (x,y){
  if (y===0){
    for (var i=x-1;i>-1;i--){
      if (this.get(i,y)<this.get(x,y)){
        return i;
      }
    }
    return -1;
  }else{
    for (var i=x-1;i>-1;i--){
      if (this.get(i,y)<this.get(x,y)&&this.ancestry(x,y-1).includes(i)){
        return i;
      }
    }
    return -1;
  }
}
Matrix.prototype.ancestry=function (x,y){
  var r=[];
  var i=x;
  while (i>-1){
    r.push(i);
    i=this.getParent(i,y);
  }
  return r;
}
Matrix.prototype.badroot=function (){
  return this.getParent(this.columns-1,this.lowermostNonzero());
}
Matrix.prototype.color=function (x,y,ver){
  if (ver=="4"){
    if (y<this.lowermostNonzero()&&x>=this.badroot()&&x!==this.columns-1){
      if (this.ancestry(x,y).includes(this.badroot())){
        return green;
      }else{
        return pink;
      }
    }else{
      return canvasbg;
    }
  }else if (ver=="3.3"){
    if (y<this.lowermostNonzero()&&x>=this.badroot()&&x!==this.columns-1){
      if (this.ancestry(x,this.lowermostNonzero()).includes(this.badroot())||this.getParent(x,y)>this.badroot()&&this.color(this.getParent(x,y),y,ver)==green){
        return green;
      }else{
        return pink;
      }
    }else{
      return canvasbg;
    }
  }else{
    return canvasflat;
  }
}
//standard check, ported from yaBMS c/bms.c (isstd, expand, compmat) for BM4.
//a matrix here is an array of columns, every column an array of ys numbers
var bmCompare=function (a,b,ys){ // +1: a>b, 0: a==b, -1: a<b, lexicographic, a prefix is smaller
  var n=Math.min(a.length,b.length);
  for(var x=0;x<n;x++){
    for(var y=0;y<ys;y++){
      if(a[x][y]>b[x][y])return 1;
      if(a[x][y]<b[x][y])return -1;
    }
  }
  return a.length>b.length?1:a.length<b.length?-1:0;
}
var bmParents=function (m){ // pim[x][y] = parent column of (x,y), -1 = none
  var xs=m.length,ys=m[0].length;
  var pim=[];
  for(var x=0;x<xs;x++){
    pim[x]=[];
    var c=m[x][0],px;
    for(px=x-1;px>=0;px--){
      if(m[px][0]<c)break;
    }
    pim[x][0]=px;
    for(var y=1;y<ys;y++){
      c=m[x][y];
      if(c===0){
        pim[x][y]=-1;
        continue;
      }
      for(px=pim[x][y-1];px!==-1;px=pim[px][y-1]){
        if(m[px][y]<c)break;
      }
      pim[x][y]=px;
    }
  }
  return pim;
}
var bmExpand=function (m,b){ // m[b] in BM4, as a new array of columns
  var xs=m.length;
  if(xs===0)return [];
  var ys=m[0].length;
  var last=m[xs-1];
  var lnz=-1; // lowermost nonzero row of the last column
  for(var y=0;y<ys;y++){
    if(last[y]===0)break;
    lnz=y;
  }
  var out=m.slice(0,xs-1).map(function (c){return c.slice();});
  if(lnz<0||b===0)return out; // simple cut
  var pim=bmParents(m);
  var r=pim[xs-1][lnz]; // bad root
  if(r<0)return out; // no bad root, does not happen for a standard matrix
  var bpxs=xs-r-1; // columns of the bad part
  var delta=[];
  for(var y=0;y<lnz;y++)delta[y]=last[y]-m[r][y];
  var am=[[]]; // am[x][y] = 1 if (r+x,y) ascends
  for(var y=0;y<=lnz;y++)am[0][y]=1;
  for(var x=1;x<bpxs;x++){
    am[x]=[];
    for(var y=0;y<=lnz;y++){
      var p=pim[r+x][y];
      am[x][y]=(p<r)?0:am[p-r][y];
    }
  }
  for(var a=1;a<=b;a++){ // the a-th copy ascends a*delta
    for(var x=0;x<bpxs;x++){
      var col=[];
      for(var y=0;y<ys;y++){
        col[y]=m[r+x][y]+((y<lnz)?a*am[x][y]*delta[y]:0);
      }
      out.push(col);
    }
  }
  return out;
}
var bmIsStandard=function (b){ // true / false, or null if it gives up
  var xs=b.length;
  if(xs===0)return true;
  var ys=b[0].length;
  //s = the smallest standard matrix >= b that agrees with (0,0,..)(1,1,..)(2,2,..).. up to the first difference
  var s=[];
  var found=false;
  for(var x=0;x<xs&&!found;x++){
    var col=[];
    for(var y=0;y<ys;y++){
      var v=b[x][y];
      if(v>x)return false; // illegal
      if(v<x){
        col[y]=v+1;
        for(var y2=y+1;y2<ys;y2++)col[y2]=0;
        found=true;
        break;
      }
      col[y]=x;
    }
    s.push(col);
  }
  for(var iter=0;iter<100000;iter++){
    var c=bmCompare(s,b,ys);
    if(c===0)return true;
    if(c<0)return false;
    //expand s with the bracket that just overshoots b's width, then cut down to b
    var oldxsm1=s.length-1;
    var bplen=bmExpand(s,1).length-oldxsm1;
    var br=(bplen!==0)?Math.floor((xs-oldxsm1)/bplen)+1:0;
    s=bmExpand(s,br);
    if(s.length>xs)s=s.slice(0,xs);
    for(var x=0;x<s.length;x++){ // cut at the first column that exceeds b
      var over=false;
      for(var y=0;y<ys;y++)if(s[x][y]>b[x][y])over=true;
      if(over){
        s=s.slice(0,x+1);
        break;
      }
    }
  }
  return null;
}
Matrix.prototype.isStandard=function (){
  if(this.standard===undefined)this.standard=bmIsStandard(this.matrix);
  return this.standard;
}
var BMV="4";
var green="#56f442";
var pink="#e841f4";
var lastmatrix;
//canvas colors, taken from the CSS custom properties at every draw
var canvasbg="#ffffff";
var canvasfg="#000000";
var canvassym="#ff0000";
var canvasflat="#dddddd";
//layout
var marginleft=10; //left edge of the drawing: the row root mark sits at 50-40, so the text starts here too
//node size
var noderadius=10;
var nodeedge=noderadius/Math.SQRT2; //where a 45 degree line meets the circle
var nodedeco=noderadius-7.8;        //the red symbols were laid out for r=7.8, so keep their clearance
//ui state, saved in localStorage
var STORAGE_KEY="BMSHydraViewer";
var uistate=(function (){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
  }catch(e){
    return {};
  }
})();
if(typeof uistate.dark!=="boolean")uistate.dark=true; //default is dark
//applied here, while <head> is being parsed, so the page never flashes light
document.documentElement.classList.toggle("dark",uistate.dark);
var saveState=function (){
  uistate.input=form.input.value;
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(uistate));
  }catch(e){
  }
}
var restoreState=function (){
  if(typeof uistate.input==="string")form.input.value=uistate.input;
}
//menu
var toggleMenu=function (){
  var open=dg("menu-panel").classList.toggle("open");
  dg("menu-button").setAttribute("aria-expanded",open);
}
var closeMenu=function (){
  dg("menu-panel").classList.remove("open");
  dg("menu-button").setAttribute("aria-expanded",false);
}
var handledarkcheck=function (){
  uistate.dark=dg("dark-check").checked;
  document.documentElement.classList.toggle("dark",uistate.dark);
  draw();
  saveState();
}
//url query, kept in sync with the textarea
var encodeParam=function (s){ // keep (),: readable, they are legal in a query
  return encodeURIComponent(s).replace(/%28/g,"(").replace(/%29/g,")").replace(/%2C/g,",");
}
var updateURL=function (){
  var base=location.href.split("#")[0].split("?")[0];
  try{
    history.replaceState(null,"",base+"?m="+encodeParam(form.input.value));
  }catch(e){ //Safari throws when replaceState is called too often
  }
}
var urltimer=null;
var updateURLLater=function (){ //debounced, so typing does not hammer replaceState
  clearTimeout(urltimer);
  urltimer=setTimeout(updateURL,300);
}
var loadURL=function (){
  var m=new URLSearchParams(location.search).get("m");
  if(m!==null)form.input.value=m;
}
//display
var dg=function (id){
  return document.getElementById(id);
}
var canvas;
var ctx;
window.onload=function (){
  console.clear();
  canvas=dg("output");
  ctx=canvas.getContext("2d");
  dg("dark-check").checked=uistate.dark;
  restoreState();
  loadURL(); //the URL wins over the saved state
  fitTextarea();
  draw();
  updateURL();
  saveState();
  form.input.addEventListener("input",handleinput);
  ["input","keyup","click","select","focus"].forEach(function (ev){
    form.input.addEventListener(ev,trackCaret);
  });
  window.addEventListener("resize",fitTextarea); //soft wrapping changes with the width
  document.addEventListener("click",function (e){
    if(!dg("menu").contains(e.target))closeMenu();
  });
}
var handleinput=function (){
  fitTextarea();
  draw();
  updateURLLater();
  saveState();
}
//expand button: inserts X[1], X[2], X[3], ... one by one under the line X of the caret
var lastCaret=0;      // caret offset as the user last placed it; our own edits never touch it
var expandState=null; // {insertAt, base, n, value}
var trackCaret=function (){ // on every user interaction with the textarea
  lastCaret=form.input.selectionStart;
  expandState=null;   // the next press starts a new sequence from the caret line
}
var handleexpand=function (){
  var ta=form.input;
  var lines=ta.value.split("\n");
  var st=expandState;
  if(!(st&&st.value===ta.value)){ //first press, or the text changed since the last one
    var caret=Math.min(lastCaret,ta.value.length);
    var line=ta.value.substr(0,caret).split("\n").length-1;
    var parsed=parseMatrices(lines[line]||"");
    if(parsed.length===0)return; //no matrix on the caret line
    st=expandState={insertAt:line+1,base:parsed[0].matrix,n:1};
  }
  var e=bmExpand(st.base,st.n); //X[n]; for a successor X this is the same cut for every n
  if(e.length===0)return; //X[n] is empty, nothing to insert
  st.n++;
  lines.splice(st.insertAt,0,new Matrix(e).toString()); //right under X[n-1]
  st.insertAt++;
  ta.value=lines.join("\n"); //browsers move the caret here, which is why the caret is tracked by trackCaret instead
  st.value=ta.value;
  if(document.activeElement===ta){ //still focused (a tap on a phone does not blur it): put the caret back on X
    try{
      ta.setSelectionRange(lastCaret,lastCaret);
    }catch(err){
    }
  }
  handleinput();
}
//keep the textarea one line taller than its content, soft-wrapped lines included
var fitTextarea=function (){
  var ta=form.input;
  var cs=getComputedStyle(ta);
  var line=parseFloat(cs.lineHeight);
  if(isNaN(line))line=parseFloat(cs.fontSize)*1.2; //"normal"
  var border=parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  ta.style.height="0px"; //so scrollHeight shrinks back when lines are deleted
  ta.style.height=(ta.scrollHeight+line+border)+"px"; //scrollHeight = content + padding
}
var cssvar=function (name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
var updateCanvasColors=function (){
  canvasbg  =cssvar("--canvas-bg")  ||"#ffffff";
  canvasfg  =cssvar("--canvas-fg")  ||"#000000";
  canvassym =cssvar("--canvas-sym") ||"#ff0000";
  canvasflat=cssvar("--canvas-flat")||"#dddddd";
}
//black or white, whichever is readable on the given node color
var srgb=function (v){
  v/=255;
  return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);
}
var textColorOn=function (color){
  if(color.charAt(0)!=="#")return canvasfg;
  var c=color;
  if(c.length===4)c="#"+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
  var r=srgb(parseInt(c.substr(1,2),16));
  var g=srgb(parseInt(c.substr(3,2),16));
  var b=srgb(parseInt(c.substr(5,2),16));
  var l=0.2126*r+0.7152*g+0.0722*b; //relative luminance, WCAG 2.x
  return l>0.179?"#000000":"#ffffff";
}
//"(0,0,0)(1,1,1)[3]\n..." -> [Matrix,...]; one matrix per line, never throws
var parseMatrices=function (text){
  var list=[];
  var lines=text.replace(/\[[^\]]*\]/g,"").split("\n"); //drop the [..] notes that basmat appends
  for(var l=0;l<lines.length;l++){
    var line=lines[l].replace(/[^0-9,()]/g,""); //anything else is noise
    var columns=[];
    var re=/\(([0-9,]*)\)/g;
    var g;
    while((g=re.exec(line))!==null){
      var col=g[1].split(",").filter(function (v){return v!=="";}).map(Number);
      if(col.length>0)columns.push(col);
    }
    if(columns.length===0)continue; //empty or unparsable line
    var rows=0;
    for(var i=0;i<columns.length;i++)rows=[rows,columns[i].length].max();
    for(var i=0;i<columns.length;i++){
      while(columns[i].length<rows)columns[i].push(0);
    }
    list.push(new Matrix(columns));
  }
  return list;
}
var draw=function (){
  updateCanvasColors();
  var matrixList=parseMatrices(form.input.value);
  var matrices=matrixList.length;
  outimg.style.display=matrices?"":"none"; //nothing to show yet
  if(!matrices)return;
  for(var cycle=0;cycle<2;cycle++){ // draw twice because image size
    //clear canvas
    ctx.fillStyle=canvasbg;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    //draw
    var x=0;
    var y=0;
    for(var m=0;m<matrices;m++){
      var matrix=matrixList[m];
      //draw string
      ctx.fillStyle=canvasfg;
      ctx.font = '18px Arial';
      var text=matrix.toString();
      ctx.fillText(text,marginleft,y+30);
      x=[x,marginleft*2+ctx.measureText(text).width].max(); //the text can be wider than the hydra
      y+=30;

      if(BMV=="3.3+4"){
        // both matrices
        var xx=50;
        var y1=drawMatrix(xx,y, "3.3", matrix);
        xx+=30+(matrix.columns+1)*30;
        var y2=drawMatrix(xx,y, "4"  , matrix);
        xx+=30+(matrix.columns+1)*30;
        x=[x,xx-50].max();
        y=[y1,y2].max();
        x=[x,drawStandardWarning(50,y,matrix)].max();
      }else{
        // single matrix
        var xx=50;
        y=drawMatrix(xx, y, BMV, matrix);
        xx+=30+(matrix.columns+1)*30;
        x=[x,xx-50].max();
        x=[x,drawStandardWarning(50,y,matrix)].max();
      }
    }//m

    //resize
    x=Math.ceil(x);
    var data = ctx.getImageData(0, 0, x, y);
    canvas.width=x;
    canvas.height=y;
    ctx.putImageData(data, 0, 0);
    //enable save
    outimg.width  = canvas.width;
    outimg.height = canvas.height;
    outimg.src = canvas.toDataURL('image/jpg');
  }//for cycle
}//draw()
//"(🚨 non-standard)" to the right of the bottom root mark; returns the right edge used
var drawStandardWarning=function (x, ynext, matrix){
  if(matrix.isStandard()!==false)return 0;
  var text="(🚨 non-standard)";
  var tx=x-10;         // the root mark spans x-40..x-20
  var ty=ynext-50+36;  // drawMatrix returns the last row base + 50
  ctx.fillStyle=canvassym;
  ctx.font="15px arial";
  ctx.fillText(text,tx,ty);
  return tx+ctx.measureText(text).width+marginleft;
}
var drawMatrix=function (x, y, ver, matrix){
  var columns=matrix.columns;
  var rows=matrix.rows;
  var rowbase=[x,y];
  for (var y=0;y<matrix.rows;y++){
    //get lowerbound of upper row
    var lowerbound=new Array(matrix.columns);
    if(y>0){
      for(var x=0;x<matrix.columns;x++)lowerbound[x]=+Infinity;
      for(var x=matrix.columns-1;x>=0;x--){
        var z=matrix.get(x,y-1);
        lowerbound[x]=[lowerbound[x],z].min();
        var p=matrix.getParent(x,y-1);
        for(var x2=p+1;x2<=x;x2++){
          lowerbound[x2]=[lowerbound[x2],z].min();
        }
      }
    }else{
      for(var x=0;x<matrix.columns;x++)lowerbound[x]=0;
    }
    //get upperbound of current row
    var upperbound=new Array(matrix.columns);
    for(var x=0;x<matrix.columns;x++)upperbound[x]=0;
    for(var x=matrix.columns-1;x>=0;x--){
      var z=matrix.get(x,y);
      upperbound[x]=[upperbound[x],z].max();
      var p=matrix.getParent(x,y);
      if(p!=-1){
        for(var x2=p+1;x2<=x;x2++){
          upperbound[x2]=[upperbound[x2],z-1].max();
        }
      }
    }
    //make margin
    var margin=0;
    for(var x=0;x<matrix.columns;x++){
      margin = [margin, upperbound[x]-lowerbound[x]].max();
    }
    //row root
    rowbase[1]=rowbase[1]+(margin+1)*30;
    ctx.strokeStyle=canvasfg;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(rowbase[0]-20,rowbase[1]+20);
    ctx.lineTo(rowbase[0]-40,rowbase[1]+40);
    ctx.moveTo(rowbase[0]-20,rowbase[1]+40);
    ctx.lineTo(rowbase[0]-40,rowbase[1]+20);
    ctx.stroke();
    for (var x=0;x<matrix.columns;x++){
      //node
      ctx.strokeStyle=canvasfg;
      var nodecolor=matrix.color(x,y,ver);
      ctx.fillStyle=nodecolor;
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.arc(rowbase[0]+x*30,rowbase[1]-matrix.get(x,y)*30,noderadius,0,2*Math.PI);
      ctx.fill();
      ctx.stroke();
      //number
      ctx.fillStyle=textColorOn(nodecolor);
      ctx.font="15px arial";
      ctx.fillText(matrix.get(x,y),rowbase[0]-4+x*30,rowbase[1]+5-matrix.get(x,y)*30);
      //bad root symbol
      if (x==matrix.badroot()){
        var bx=rowbase[0]+x*30-nodedeco;
        var by=rowbase[1]-matrix.get(x,y)*30-nodedeco;
        ctx.strokeStyle=canvassym;
        ctx.beginPath();
        ctx.moveTo(bx-10,by+2);
        ctx.lineTo(bx-15,by-2);
        ctx.lineTo(bx-10,by-4);
        ctx.lineTo(bx-12,by-10);
        ctx.lineTo(bx-7,by-8);
        ctx.lineTo(bx-5,by-14);
        ctx.lineTo(bx-0,by-10);
        ctx.stroke();
      }
      //rightmost column symbol
      if (x==matrix.columns-1){
        var rx=rowbase[0]+x*30+nodedeco;
        var ry=rowbase[1]-matrix.get(x,y)*30-nodedeco;
        ctx.strokeStyle=canvassym;
        ctx.beginPath();
        ctx.moveTo(rx+0,ry-15);
        ctx.lineTo(rx+10,ry-5);
        ctx.moveTo(rx+0,ry-5);
        ctx.lineTo(rx+10,ry-15);
        ctx.stroke();
      }
      //parency line
      ctx.strokeStyle=canvasfg;
      ctx.beginPath();
      var parent=matrix.getParent(x,y);
      if (parent==-1){
        ctx.moveTo(rowbase[0]+parent*30+nodeedge,rowbase[1]+30-nodeedge);
        ctx.lineTo(rowbase[0]+parent*30+15,rowbase[1]+30-15);
      }else{
        ctx.moveTo(rowbase[0]+parent*30+nodeedge,rowbase[1]-matrix.get(parent,y)*30-nodeedge);
        ctx.lineTo(rowbase[0]+parent*30+15,rowbase[1]-matrix.get(parent,y)*30-15);
      }
      ctx.lineTo(rowbase[0]+x*30-15,rowbase[1]-matrix.get(x,y)*30+15);
      ctx.lineTo(rowbase[0]+x*30-nodeedge,rowbase[1]-matrix.get(x,y)*30+nodeedge);
      ctx.stroke();
    }
  }
  lastmatrix=matrix;
  return rowbase[1]+50;
}
