import { useEffect, useRef, useState } from 'react'
import { Box, LoaderCircle, RotateCcw, AlertCircle } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Case, Mesh } from './types'
const bundles=new Map<string,Promise<Record<string,Mesh>>>()
function getBundle(url:string) {
  let bundle=bundles.get(url)
  if(!bundle){
    bundle=fetch(url).then(async response=>{
      if(!response.ok)throw new Error('Surface data could not load')
      const bytes=await response.arrayBuffer()
      const header=new Uint8Array(bytes,0,Math.min(bytes.byteLength,2))
      if(header[0]===31&&header[1]===139){
        if(typeof DecompressionStream==='undefined')throw new Error('Please use a browser with gzip decompression support for 3D surfaces')
        const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
        return JSON.parse(await new Response(stream).text()) as Record<string,Mesh>
      }
      return JSON.parse(new TextDecoder().decode(bytes)) as Record<string,Mesh>
    }).catch(error=>{bundles.delete(url);throw error})
    bundles.set(url,bundle)
  }
  return bundle
}
type Scene={renderer:THREE.WebGLRenderer;camera:THREE.PerspectiveCamera;controls:OrbitControls;group:THREE.Group;render:()=>void;fit:()=>void}
export function SurfaceView({item,selected}:{item:Case;selected:number[]}) {
  const host=useRef<HTMLDivElement>(null),scene=useRef<Scene|null>(null)
  const [ready,setReady]=useState(false),[stage,setStage]=useState<'raw'|'refined'>('refined'),[loading,setLoading]=useState(false),[error,setError]=useState('')
  useEffect(()=>{
    if(!host.current)return
    let renderer:THREE.WebGLRenderer
    try{renderer=new THREE.WebGLRenderer({antialias:true})}catch{setError('WebGL is unavailable in this browser');return}
    const element=host.current;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#10151c');element.appendChild(renderer.domElement)
    const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,6000),controls=new OrbitControls(camera,renderer.domElement)
    controls.enableDamping=false;controls.minDistance=15;controls.maxDistance=2500
    world.add(new THREE.HemisphereLight(0xffffff,0x596779,2.5))
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(100,150,-300);world.add(light)
    const rim=new THREE.DirectionalLight(0xc1d0e4,2);rim.position.set(-100,100,100);world.add(rim)
    const group=new THREE.Group();world.add(group)
    const render=()=>renderer.render(world,camera)
    const fit=()=>{
      if(!group.children.length){render();return}
      const box=new THREE.Box3().setFromObject(group),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3())
      const distance=Math.max(size.y,size.x/camera.aspect,size.z,20)/(2*Math.tan(THREE.MathUtils.degToRad(19)))*1.15
      controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(distance*.3,distance*.12,-distance));controls.update();render()
    }
    controls.addEventListener('change',render)
    scene.current={renderer,camera,controls,group,render,fit}
    const resize=new ResizeObserver(()=>{renderer.setSize(element.clientWidth,element.clientHeight);camera.aspect=element.clientWidth/Math.max(element.clientHeight,1);camera.updateProjectionMatrix();fit()})
    resize.observe(element);setReady(true)
    return()=>{resize.disconnect();controls.removeEventListener('change',render);controls.dispose();group.traverse(child=>{if(child instanceof THREE.Mesh){child.geometry.dispose();(child.material as THREE.Material).dispose()}});renderer.dispose();renderer.domElement.remove();scene.current=null}
  },[])
  useEffect(()=>{
    const state=scene.current;if(!state||!ready)return
    let cancelled=false
    for(const child of [...state.group.children]){state.group.remove(child);if(child instanceof THREE.Mesh){child.geometry.dispose();(child.material as THREE.Material).dispose()}}
    state.render();setError('');setLoading(selected.length>0)
    if(!selected.length)return
    getBundle(item.meshes[stage]).then(bundle=>{
      if(cancelled)return
      for(const label of item.labels.filter(label=>selected.includes(label.id))) {
        const mesh=bundle[String(label.id)];if(!mesh?.vertices_ras_mm.length)continue
        const geometry=new THREE.BufferGeometry()
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(mesh.vertices_ras_mm.flatMap(([x,y,z])=>[x,z,-y]),3))
        geometry.setIndex(mesh.faces.flat());geometry.computeVertexNormals()
        state.group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:label.color,roughness:.65,metalness:.02,side:THREE.DoubleSide})))
      }
      state.fit();setLoading(false)
    }).catch(err=>{if(!cancelled){setError(err.message);setLoading(false)}})
    return()=>{cancelled=true}
  },[item,stage,selected,ready])
  return <section className="vd-card vd-surface-card" id="geometry">
    <div className="vd-card-heading"><div><h2><Box size={16}/> 3D anatomy</h2><p>Actual prediction surfaces · physical space</p></div><button className="vd-icon-button" aria-label="Reset 3D camera" onClick={()=>scene.current?.fit()}><RotateCcw size={16}/></button></div>
    <div className="vd-surface-toolbar"><div className="vd-segmented">{(['raw','refined'] as const).map(value=><button key={value} className={stage===value?'active':''} onClick={()=>setStage(value)}>{value==='raw'?'Before':'After'}</button>)}</div><span>Drag to rotate · scroll to zoom</span></div>
    <div className="vd-surface-stage"><div ref={host} className="vd-surface-host" aria-label="Interactive vertebrae mesh"/>{loading&&<div className="vd-view-message"><LoaderCircle size={18} className="vd-spin"/> Loading real surfaces</div>}{error&&<div className="vd-view-message vd-error"><AlertCircle size={17}/>{error}</div>}{!selected.length&&<div className="vd-view-message">Choose a vertebra in the sidebar</div>}<div className="vd-surface-orientation">S superior · R right · A anterior</div></div>
    <p className="vd-footnote">Approximate surfaces. Volumes use the full-resolution voxel grid.</p>
  </section>
}
