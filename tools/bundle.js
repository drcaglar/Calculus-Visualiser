const fs=require('fs'),path=require('path');
const root=process.argv[2],out=process.argv[3];
let h=fs.readFileSync(path.join(root,'index.html'),'utf8');
h=h.replace(/<link rel="stylesheet" href="([^"]+)">/g,(m,p)=>{
  let css=fs.readFileSync(path.join(root,p),'utf8');
  if(/katex/.test(p)){
    const dir=path.dirname(path.join(root,p));
    css=css.replace(/src:\s*url\(([^)]+\.woff2)\)\s*format\("woff2"\)[^;}]*/g,(mm,f)=>{
      const fp=path.join(dir,f); if(!fs.existsSync(fp)) return 'src:local(serif)'; const b=fs.readFileSync(fp).toString('base64');
      return 'src:url(data:font/woff2;base64,'+b+') format("woff2")';
    });
  }
  return '<style>\n'+css+'\n</style>';});
h=h.replace(/<script src="([^"]+)"><\/script>/g,(m,p)=>'<script>\n'+fs.readFileSync(path.join(root,p),'utf8').replace(/<\/script/gi,'<\/script')+'\n</script>');
fs.writeFileSync(out,h,'utf8');console.log((h.length/1e6).toFixed(2)+' MB',(h.match(/src="/g)||[]).length+' external src left',(h.match(/url\(fonts/g)||[]).length+' font urls left');
