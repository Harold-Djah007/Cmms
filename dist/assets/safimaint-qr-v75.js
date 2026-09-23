'use strict';

// SafiMaintain QR v75 — dependency-free QR Code Model 2, version 3-L.
// Encodes short asset/part/work references locally so printed tags remain usable offline.
(function(root){
  const VERSION=3,SIZE=29,DATA_WORDS=55,EC_WORDS=15,QUIET=4;
  const EXP=new Array(512),LOG=new Array(256);
  let value=1;
  for(let i=0;i<255;i++){EXP[i]=value;LOG[value]=i;value<<=1;if(value&0x100)value^=0x11d}
  for(let i=255;i<512;i++)EXP[i]=EXP[i-255];

  function utf8(text){
    const out=[];
    for(const ch of String(text??'')){
      const cp=ch.codePointAt(0);
      if(cp<0x80)out.push(cp);
      else if(cp<0x800)out.push(0xc0|(cp>>6),0x80|(cp&63));
      else if(cp<0x10000)out.push(0xe0|(cp>>12),0x80|((cp>>6)&63),0x80|(cp&63));
      else out.push(0xf0|(cp>>18),0x80|((cp>>12)&63),0x80|((cp>>6)&63),0x80|(cp&63));
    }
    return out;
  }
  function pushBits(target,value,length){for(let i=length-1;i>=0;i--)target.push((value>>>i)&1)}
  function dataWords(text){
    const data=utf8(text);if(data.length>53)throw new Error('QR payload is longer than version 3-L capacity');
    const bits=[];pushBits(bits,4,4);pushBits(bits,data.length,8);data.forEach(byte=>pushBits(bits,byte,8));
    for(let i=0;i<Math.min(4,DATA_WORDS*8-bits.length);i++)bits.push(0);
    while(bits.length%8)bits.push(0);
    const words=[];for(let i=0;i<bits.length;i+=8){let byte=0;for(let j=0;j<8;j++)byte=(byte<<1)|(bits[i+j]||0);words.push(byte)}
    let pad=true;while(words.length<DATA_WORDS){words.push(pad?0xec:0x11);pad=!pad}
    return words;
  }
  function multiply(a,b){
    const out=new Array(a.length+b.length-1).fill(0);
    for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(a[i]&&b[j])out[i+j]^=EXP[LOG[a[i]]+LOG[b[j]]];
    return out;
  }
  function errorWords(data){
    let generator=[1];for(let i=0;i<EC_WORDS;i++)generator=multiply(generator,[1,EXP[i]]);
    const result=data.concat(new Array(EC_WORDS).fill(0));
    for(let i=0;i<data.length;i++){
      const factor=result[i];if(!factor)continue;
      const log=LOG[factor];for(let j=0;j<generator.length;j++)if(generator[j])result[i+j]^=EXP[log+LOG[generator[j]]];
    }
    return result.slice(data.length);
  }
  function bchFormat(data){
    const generator=0x537,mask=0x5412;let value=data<<10;
    const degree=n=>{let d=0;while(n){d++;n>>>=1}return d};
    while(degree(value)>=degree(generator))value^=generator<<(degree(value)-degree(generator));
    return ((data<<10)|value)^mask;
  }
  function maskBit(mask,row,col){
    switch(mask){case 0:return (row+col)%2===0;case 1:return row%2===0;case 2:return col%3===0;case 3:return (row+col)%3===0;case 4:return (Math.floor(row/2)+Math.floor(col/3))%2===0;case 5:return (row*col)%2+(row*col)%3===0;case 6:return ((row*col)%2+(row*col)%3)%2===0;default:return ((row*col)%3+(row+col)%2)%2===0}
  }
  function setFinder(matrix,row,col){
    for(let r=-1;r<=7;r++)for(let c=-1;c<=7;c++){
      const y=row+r,x=col+c;if(y<0||x<0||y>=SIZE||x>=SIZE)continue;
      matrix[y][x]=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);
    }
  }
  function setAlignment(matrix,row,col){for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)matrix[row+r][col+c]=Math.abs(r)===2||Math.abs(c)===2||(r===0&&c===0)}
  function setFormat(matrix,mask){
    const bits=bchFormat((1<<3)|mask);
    for(let i=0;i<15;i++){
      const dark=((bits>>>i)&1)===1;
      if(i<6)matrix[i][8]=dark;else if(i<8)matrix[i+1][8]=dark;else matrix[SIZE-15+i][8]=dark;
      if(i<8)matrix[8][SIZE-i-1]=dark;else if(i<9)matrix[8][15-i]=dark;else matrix[8][14-i]=dark;
    }
    matrix[SIZE-8][8]=true;
  }
  function build(text,mask){
    const matrix=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
    setFinder(matrix,0,0);setFinder(matrix,SIZE-7,0);setFinder(matrix,0,SIZE-7);setAlignment(matrix,22,22);
    for(let i=8;i<SIZE-8;i++){if(matrix[i][6]===null)matrix[i][6]=i%2===0;if(matrix[6][i]===null)matrix[6][i]=i%2===0}
    setFormat(matrix,mask);
    const words=dataWords(text),stream=words.concat(errorWords(words));let byte=0,bit=7,up=true;
    for(let col=SIZE-1;col>0;col-=2){if(col===6)col--;const rows=Array.from({length:SIZE},(_,i)=>up?SIZE-1-i:i);up=!up;
      for(const row of rows)for(let offset=0;offset<2;offset++){
        const x=col-offset;if(matrix[row][x]!==null)continue;
        let dark=byte<stream.length&&((stream[byte]>>>bit)&1)===1;if(maskBit(mask,row,x))dark=!dark;matrix[row][x]=dark;
        bit--;if(bit<0){byte++;bit=7}
      }
    }
    return matrix;
  }
  function penalty(matrix){
    let score=0,dark=0;
    const lines=[...matrix,...Array.from({length:SIZE},(_,x)=>matrix.map(row=>row[x]))];
    for(const line of lines){let run=1;for(let i=1;i<=SIZE;i++){if(i<SIZE&&line[i]===line[i-1])run++;else{if(run>=5)score+=3+run-5;run=1}}
      const text=line.map(v=>v?'1':'0').join('');for(let i=0;i<=SIZE-11;i++){const s=text.slice(i,i+11);if(s==='10111010000'||s==='00001011101')score+=40}}
    for(let y=0;y<SIZE-1;y++)for(let x=0;x<SIZE-1;x++)if(matrix[y][x]===matrix[y][x+1]&&matrix[y][x]===matrix[y+1][x]&&matrix[y][x]===matrix[y+1][x+1])score+=3;
    matrix.forEach(row=>row.forEach(cell=>{if(cell)dark++}));score+=Math.floor(Math.abs(dark*100/(SIZE*SIZE)-50)/5)*10;return score;
  }
  function matrix(text){let best=null,bestScore=Infinity;for(let mask=0;mask<8;mask++){const candidate=build(text,mask),score=penalty(candidate);if(score<bestScore){best=candidate;bestScore=score}}return best}
  function svg(text,label=text){
    const modules=matrix(text),side=SIZE+QUIET*2,path=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(modules[y][x])path.push('M'+(x+QUIET)+' '+(y+QUIET)+'h1v1h-1z');
    return '<svg viewBox="0 0 '+side+' '+side+'" role="img" aria-label="QR code for '+String(label).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="'+side+'" height="'+side+'" fill="#fff"/><path fill="#071522" d="'+path.join('')+'"/></svg>';
  }
  root.SafiQR={version:VERSION,matrix,svg};
})(typeof window!=='undefined'?window:this);
