import {mkdir,rm,copyFile,cp} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','styles.css','app.js','schedule.js','defaults.js','icons.js','.nojekyll'])await copyFile(file,`dist/${file}`);
await cp('assets','dist/assets',{recursive:true});
console.log('SchoolTool static site is ready in dist/.');
