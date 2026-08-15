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
  uistate.version=BMV;
  uistate.input=form.input.value;
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(uistate));
  }catch(e){
  }
}
var restoreState=function (){
  if(typeof uistate.input==="string")form.input.value=uistate.input;
  setVersion(uistate.version);
}
var setVersion=function (v){
  var found=false;
  for(var i=0;i<form.version.length;i++){
    if(form.version[i].value===v)found=true;
  }
  if(!found)return false; //ignore an unknown version and keep the current one
  for(var i=0;i<form.version.length;i++){
    form.version[i].checked=(form.version[i].value===v);
  }
  BMV=v;
  return true;
}
var changeVersion = function (){
  for(var i=0;i<form.version.length;i++){
    if(form.version[i].checked)BMV=form.version[i].value;
  }
  draw();
  updateLink();
  saveState();
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
//permalink
var encodeParam=function (s){ // keep (),: readable, they are legal in a query
  return encodeURIComponent(s).replace(/%28/g,"(").replace(/%29/g,")").replace(/%2C/g,",");
}
var updateLink=function (){
  var base=location.href.split("#")[0].split("?")[0];
  dg("link").href=base+"?m="+encodeParam(form.input.value)+"&v="+encodeParam(BMV);
}
var loadLink=function (){
  var urlsp=new URLSearchParams(location.search);
  var m=urlsp.get("m");
  if(m!==null)form.input.value=m;
  setVersion(urlsp.get("v"));
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
  loadLink(); //the URL wins over the saved state
  draw();
  updateLink();
  saveState();
  document.addEventListener("click",function (e){
    if(!dg("menu").contains(e.target))closeMenu();
  });
}
var handledrawbutton=function (){
  draw();
  updateLink();
  saveState();
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
var draw=function (){
  updateCanvasColors();
  for(var cycle=0;cycle<2;cycle++){ // draw twice because image size
    //parse matrices
    var matricesText=form.input.value.replace(/\[.*\]/g,"").replace(/\n\n+/g,"\n").replace(/ /g,"");
    var matrixTextList=matricesText.split("\n");
    var matrices = matrixTextList.length;
    var matrixList = new Array(matrices);
    var height=0;
    for(var m=0;m<matrices;m++){
      matrixList[m]=JSON.parse(
        "["+matrixTextList[m]
          .replace(/\(/g,"[")
          .replace(/\)/g,"]")
          .replace(/\]\[/g,"],[")+"]");
      var matrix=matrixList[m];
      var columns=matrix.length;
      var rows=0;
      for (var i=0;i<columns;i++){
        if (matrix[i].length>rows){
          rows=matrix[i].length;
        }
      }
      for (var i=0;i<columns;i++){
        while (matrix[i].length<rows){
          matrix[i].push(0);
        }
      }
      matrixList[m]=new Matrix(matrix);
    }

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
      }else{
        // single matrix
        var xx=50;
        y=drawMatrix(xx, y, BMV, matrix);
        xx+=30+(matrix.columns+1)*30;
        x=[x,xx-50].max();
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
      console.log(x+","+y+":"+matrix.getParent(x,y))
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
