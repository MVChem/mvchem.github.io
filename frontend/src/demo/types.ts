export type Plane = 'sagittal' | 'coronal' | 'axial'
export type Stage = 'raw' | 'refined' | 'changes'
export interface Label { id:number; name:string; color:string; before_voxels:number; after_voxels:number; before_components:number; after_components:number; before_volume_ml:number; after_volume_ml:number; removed_voxels:number; added_voxels:number; flags:string[] }
export interface Frame { index:number; ct:string; labels:string; widthMm:number; heightMm:number; changedPixels:number }
export interface Case { id:string; shape:number[]; original_shape:number[]; spacing_mm:number[]; original_orientation:string[]; changed_voxels:number; removed_voxels:number; added_voxels:number; before_components:number; after_components:number; initial_indices:Record<Plane,number>; change_indices:Record<Plane,number>; labels:Label[]; frames:Record<Plane,Frame[]>; meshes:Record<'raw'|'refined',string>; comparisonPdf:string; hashes:Record<string,string>; parameters:{ max_component_fraction:number; min_distance_mm:number; conservative:boolean; fill_holes_mm3:number } }
export interface Manifest { version:string; author:string; groundTruthAvailable:false; cases:Case[]; taskUrl:string; dataUrl:string; upstreamLicenseUrl:string; downloads:Record<'script'|'csv'|'masks',string> }
export interface Mesh { vertices_ras_mm:number[][]; faces:number[][]; step_size:number }
export const labelName = (name:string) => name.replace('vertebrae_', '')
export const number = (value:number) => value.toLocaleString('en-US')
