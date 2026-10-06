import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import type { Frame, Label, Plane, Stage } from './types'

type Pixels = { ct:ImageData; labels:ImageData }
const cache = new Map<string,Promise<Pixels>>()
async function readPixels(url:string) {
  const image = new Image(); image.src = url; await image.decode()
  const canvas = document.createElement('canvas'); canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
  const context=canvas.getContext('2d',{willReadFrequently:true})!
  context.drawImage(image,0,0)
  return context.getImageData(0,0,canvas.width,canvas.height)
}
function getPixels(frame:Frame) {
  let entry=cache.get(frame.ct)
  if (!entry) {
    entry=Promise.all([readPixels(frame.ct),readPixels(frame.labels)]).then(([ct,labels])=>({ct,labels})).catch(error=>{cache.delete(frame.ct);throw error})
    cache.set(frame.ct,entry)
    if(cache.size>10)cache.delete(cache.keys().next().value!)
  }
  return entry
}
const orientations:Record<Plane,string[]>={sagittal:['S','I','P','A'],coronal:['S','I','R','L'],axial:['A','P','R','L']}
export function PixelSlice({frame,stage,plane,windowWidth,level,opacity,selected,labels,zoom,origin}:{frame:Frame;stage:Stage;plane:Plane;windowWidth:number;level:number;opacity:number;selected:number[];labels:Label[];zoom:number;origin:string}) {
  const canvas=useRef<HTMLCanvasElement>(null)
  const [loading,setLoading]=useState(true),[error,setError]=useState('')
  useEffect(()=>{
    let cancelled=false;setLoading(true);setError('')
    getPixels(frame).then(pixels=>{
      if(cancelled||!canvas.current)return
      const source=document.createElement('canvas');source.width=pixels.ct.width;source.height=pixels.ct.height
      const ctx=source.getContext('2d')!,image=ctx.createImageData(source.width,source.height)
      const allowed=new Uint8Array(25);for(const id of selected)allowed[id]=1
      const colors=labels.map(label=>({id:label.id,rgb:[1,3,5].map(index=>parseInt(label.color.slice(index,index+2),16))}))
      const palette=new Map(colors.map(label=>[label.id,label.rgb]))
      const ct=pixels.ct.data,mask=pixels.labels.data,out=image.data
      for(let index=0;index<out.length;index+=4) {
        const hu=ct[index]+(ct[index+1]<<8)-32768
        const gray=Math.max(0,Math.min(255,(hu-level+windowWidth/2)/windowWidth*255))
        out[index]=out[index+1]=out[index+2]=gray;out[index+3]=255
        const before=mask[index],after=mask[index+1]
        let color:number[]|undefined
        if(stage==='changes'&&before!==after) {
          if(before>0&&allowed[before])color=[255,91,111]
          if(after>0&&allowed[after])color=[85,220,226]
        } else if(stage!=='changes') {
          const id=stage==='raw'?before:after
          if(id>0&&allowed[id])color=palette.get(id)
        }
        if(color)for(let channel=0;channel<3;channel++)out[index+channel]=gray*(1-opacity)+color[channel]*opacity
      }
      ctx.putImageData(image,0,0)
      const ratio=frame.widthMm/frame.heightMm
      canvas.current.width=ratio>=1?900:Math.round(900*ratio)
      canvas.current.height=ratio>=1?Math.round(900/ratio):900
      canvas.current.getContext('2d')!.drawImage(source,0,0,canvas.current.width,canvas.current.height)
      canvas.current.dataset.nativeIndex=String(frame.index)
      setLoading(false)
    }).catch(err=>{if(!cancelled){setError(err.message);setLoading(false)}})
    return()=>{cancelled=true}
  },[frame,stage,windowWidth,level,opacity,selected,labels])
  const title={raw:'Before',refined:'After',changes:'Changes'}[stage]
  return <article className={`vd-slice vd-slice-${stage}`} aria-label={`${title} CT slice`}>
    <header><span className="vd-stage-dot"/><b>{title}</b><small>{stage==='raw'?'Pretrained prediction':stage==='refined'?'Conservative refinement':'Changed voxels'}</small></header>
    <div className="vd-slice-image">
      <canvas ref={canvas} style={{transform:`scale(${zoom})`,transformOrigin:origin,visibility:loading||error?'hidden':'visible'}} aria-label={`${plane} ${title.toLowerCase()} CT`} data-stage={stage}/>
      {loading&&<div className="vd-view-message"><LoaderCircle size={18} className="vd-spin"/> Loading slice</div>}
      {error&&<div className="vd-view-message vd-error"><AlertCircle size={18}/>{error}</div>}
      {orientations[plane].map((letter,index)=><span key={index} className={`vd-orient vd-orient-${index}`}>{letter}</span>)}
      <span className="vd-plane-label">{plane}</span>
    </div>
    <footer>{stage==='changes'?<><i className="vd-removed"/> Removed <i className="vd-added"/> Added</>:<>Original CT · shared window and slice</>}</footer>
  </article>
}
