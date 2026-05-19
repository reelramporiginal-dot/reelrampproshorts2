import supabase from './_supabase.js';

const STORAGE_BASE = process.env.BUNNY_STORAGE_URL || 'https://storage.bunnycdn.com/trrlramp2';
const CDN_BASE = process.env.BUNNY_CDN_URL || 'https://trrlramp2.b-cdn.net';
const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY || 'e270b325-f24b-41dd-bb4deaeca7fc-5d54-47eb';

function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-File-Name, X-Content-Type');}
function safeName(name='upload.bin'){return name.replace(/[^a-zA-Z0-9._-]/g,'-').replace(/-+/g,'-');}

export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();try{if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});const chunks=[];for await (const chunk of req) chunks.push(chunk);const buffer=Buffer.concat(chunks);if(!buffer.length)return res.status(400).json({error:'No file body received'});const rawName=req.headers['x-file-name'] || `upload-${Date.now()}.mp4`;const fileName=`${Date.now()}-${safeName(String(rawName))}`;const target=`${STORAGE_BASE.replace(/\/$/,'')}/${fileName}`;const upload=await fetch(target,{method:'PUT',headers:{AccessKey:ACCESS_KEY,'Content-Type':String(req.headers['x-content-type']||'application/octet-stream')},body:buffer});if(!upload.ok){const text=await upload.text().catch(()=>'');return res.status(500).json({error:`Bunny upload failed ${upload.status}`,details:text});}const cdnUrl=`${CDN_BASE.replace(/\/$/,'')}/${fileName}`;await supabase.from('audit_logs').insert({actor:'admin',action:'bunny_upload',resource:'bunny',metadata:{fileName,cdnUrl,size:buffer.length}});return res.status(201).json({ok:true,fileName,cdnUrl,storageUrl:target,size:buffer.length});}catch(err){console.error('bunny_upload api',err);return res.status(500).json({error:err.message})}}
