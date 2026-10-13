import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const evidence=JSON.parse(readFileSync('recordings/recording-evidence.json','utf8'));
const raw=readFileSync('recordings/raw-path.txt','utf8').trim();
const output=resolve('DEMO_VIDEO.mp4');
const stamp=t=>{const n=Math.round(t*100);return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;};
const ass=`[Script Info]
ScriptType: v4.00+
PlayResX: 1440
PlayResY: 1010
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,65,65,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`+evidence.cues.map((c,i)=>`Dialogue: 0,${stamp(c.at)},${stamp(evidence.cues[i+1]?.at??451)},Default,,0,0,0,,${c.text.replace(/[{}]/g,'')}`).join('\n');
writeFileSync('recordings/captions.ass',ass);
const inputs=evidence.segments ? evidence.segments.flatMap(s=>['-i',resolve(s.path)]) : ['-i',resolve(raw)];
const filter=evidence.segments ? ['-filter_complex',`[0:v]trim=duration=307,setpts=PTS-STARTPTS[a];[1:v]trim=duration=144,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,pad=iw:ih+110:0:0:black,ass=captions.ass[out]`,'-map','[out]'] : ['-vf','pad=iw:ih+110:0:0:black,ass=captions.ass'];
const encoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','warning','-y',...inputs,...filter,'-c:v','libx264','-preset','veryfast','-crf','22','-threads','2','-filter_complex_threads','2','-pix_fmt','yuv420p','-r','25','-t','451','-an','-movflags','+faststart',output],{cwd:resolve('recordings'),stdio:'inherit'});
assert.equal(encoded.status,0,'Video encoding failed');
const probe=spawnSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output],{encoding:'utf8'});assert.equal(probe.status,0);
const info=JSON.parse(probe.stdout), duration=Number(info.format.duration),size=statSync(output).size;
assert.ok(duration>=420&&duration<=540,'Video must be 7–9 minutes');assert.ok(size<2*1024**3,'Video must be below 2 GiB');
const decoded=spawnSync('ffmpeg',['-v','error','-i',output,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,'Full video decode failed');
writeFileSync('evidence/video-check.json',JSON.stringify({checkedAt:new Date().toISOString(),filename:'DEMO_VIDEO.mp4',durationSeconds:duration,bytes:size,width:info.streams[0].width,height:info.streams[0].height,codec:info.streams[0].codec_name,fullDecodePassed:true,audio:'None; explanatory captions burned into a separate bottom band',task:evidence.task.id},null,2));
console.log(JSON.stringify({output,durationSeconds:duration,megabytes:Math.round(size/1024**2),fullDecodePassed:true}));
