"""Export sampled authentic CT pixels, labels and physical meshes for the web demo.

No weights, upstream inference code, private mail or full CT volumes are copied.
Each image retains its native slice grid. CT is losslessly encoded in two RGB
channels (signed 16-bit HU + 32768); masks store before/after IDs in R/G.
"""
from pathlib import Path
import argparse, gzip, hashlib, json, shutil, sys
from datetime import datetime, timezone
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--source', type=Path, default=ROOT.parents[1]/'06/bodymaps_research_warmup')
args = p.parse_args()
source = args.source.resolve()
sys.path.insert(0, str(source/'backend'))
from app import data
from app.main import case_detail, make_mesh

case_ids = ['BDMAP_00000006', 'BDMAP_00000031']
fingerprint = hashlib.sha256(Path(__file__).read_bytes())
for case_id in case_ids:
    fingerprint.update((source/f'results/AbdomenAtlasDemoPredict/{case_id}/metrics.json').read_bytes())
version = fingerprint.hexdigest()[:16]
relative = f'/demo-data/vertebrae/{version}'
output = ROOT/'frontend/public'/relative.lstrip('/')
output.mkdir(parents=True, exist_ok=True)
manifest = {'version':version, 'createdAt':datetime.now(timezone.utc).isoformat(),
            'title':'Vertebrae refinement', 'author':'Hongkang Chu', 'groundTruthAvailable':False,
            'sourceModel':'SuPreM', 'sourceData':'AbdomenAtlasDemo',
            'taskUrl':'https://github.com/MrGiovanni/SuPreM/blob/main/direct_inference/vertebrae.md',
            'dataUrl':'https://www.cs.jhu.edu/~zongwei/dataset/AbdomenAtlasDemo.tar.gz',
            'upstreamLicenseUrl':'https://github.com/MrGiovanni/SuPreM/blob/main/LICENSE',
            'ctEncoding':'int16 HU + 32768: R=low byte, G=high byte, B=0; opaque RGB PNG',
            'maskEncoding':'R=raw ID, G=refined ID, B=0; opaque RGB PNG', 'cases':[]}
axes = {'sagittal':0, 'coronal':1, 'axial':2}

for case_id in case_ids:
    print('Exporting', case_id, flush=True)
    case = data.load_case(case_id)
    detail = case_detail(case_id)
    detail['labels'] = [{k:v for k,v in row.items() if k != 'components'} for row in detail['labels']]
    detail['frames'] = {}
    for plane, axis in axes.items():
        indices = set(map(int, np.linspace(0, case['ct'].shape[axis]-1, 36).round()))
        indices.add(detail['initial_indices'][plane]); indices.add(detail['change_indices'][plane])
        # Include vertebral centroids and changed-region coordinates, in addition
        # to the sampled whole scan. These are actual slices, not interpolated CT.
        for row in detail['labels']:
            if row['centroid_ras_mm'] is not None:
                coord = np.linalg.solve(case['affine'][:3,:3], np.array(row['centroid_ras_mm'])-case['affine'][:3,3])
                indices.add(int(np.clip(round(coord[axis]),0,case['ct'].shape[axis]-1)))
        edits = np.argwhere(case['raw'] != case['refined'])
        if len(edits):
            indices.update(map(int,np.quantile(edits[:,axis],np.linspace(0,1,13)).round()))
        folder = output/case_id/plane; folder.mkdir(parents=True,exist_ok=True)
        frames=[]
        _,width_mm,height_mm = data.slice_geometry(case,plane)
        for index in sorted(indices):
            ct = np.rint(data.extract_slice(case['ct'],plane,index)).astype(np.int32)
            encoded = np.clip(ct+32768,0,65535).astype(np.uint16)
            pixels=np.zeros((*ct.shape,3),dtype=np.uint8)
            pixels[:,:,0]=encoded&255; pixels[:,:,1]=encoded>>8
            ct_file=folder/f'{index}-ct.png'
            Image.fromarray(pixels).save(ct_file,compress_level=6)
            before=data.extract_slice(case['raw'],plane,index);after=data.extract_slice(case['refined'],plane,index)
            pixels[:,:,0]=before;pixels[:,:,1]=after
            mask_file=folder/f'{index}-labels.png'
            Image.fromarray(pixels).save(mask_file,compress_level=6)
            frames.append({'index':index,'ct':f'{relative}/{case_id}/{plane}/{ct_file.name}',
                           'labels':f'{relative}/{case_id}/{plane}/{mask_file.name}',
                           'widthMm':float(width_mm),'heightMm':float(height_mm),
                           'changedPixels':int(np.count_nonzero(before!=after))})
        detail['frames'][plane]=frames
        print(plane,len(frames),'native slices',flush=True)
    detail['meshes']={}
    revision=(source/f'results/AbdomenAtlasDemoPredict/{case_id}/metrics.json').stat().st_mtime_ns
    for stage in ['raw','refined']:
        bundle={str(label_id):make_mesh(case_id,label_id,stage,revision) for label_id in range(1,25)}
        file=output/case_id/f'{stage}-meshes.json.gz'
        with gzip.GzipFile(filename=str(file),mode='wb',mtime=0,compresslevel=6) as stream:
            stream.write(json.dumps(bundle,separators=(',',':'),allow_nan=False).encode())
        detail['meshes'][stage]=f'{relative}/{case_id}/{file.name}'
        print(stage,'mesh bundle',file.stat().st_size,'bytes',flush=True)
    manifest['cases'].append(detail)

downloads=output/'downloads';downloads.mkdir(exist_ok=True)
manifest['downloads']={}
for key,path in {'script':source/'postprocessing_vertebrae.py','csv':source/'artifacts/research_summary.csv',
                 'masks':source/'artifacts/AbdomenAtlasDemoPredict.zip'}.items():
    shutil.copy2(path,downloads/path.name)
    manifest['downloads'][key]=f'{relative}/downloads/{path.name}'
for case in manifest['cases']:
    name=case['id']+'_research_comparison.pdf'
    shutil.copy2(source/'artifacts'/name,downloads/name)
    case['comparisonPdf']=f'{relative}/downloads/{name}'
(ROOT/'backend/content/vertebrae_demo.json').write_text(json.dumps(manifest,indent=2,allow_nan=False)+'\n')
total=sum(file.stat().st_size for file in output.rglob('*') if file.is_file())
print('Finished',version,'bytes',total,flush=True)
