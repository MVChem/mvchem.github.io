"""Independently compare published pixel encodings with the source NIfTI scans."""
from pathlib import Path
import argparse,json,gzip
import nibabel as nib
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);args=p.parse_args()
manifest=json.loads((ROOT/'backend/content/vertebrae_demo.json').read_text())
report={'cases':[],'groundTruthAvailable':False,'status':'passed'}
for case in manifest['cases']:
    paths=[args.source/f'data/AbdomenAtlasDemo/{case["id"]}/ct.nii.gz',args.source/f'results/raw/{case["id"]}/combined_labels.nii.gz',args.source/f'results/AbdomenAtlasDemoPredict/{case["id"]}/combined_labels.nii.gz']
    volumes=[np.asanyarray(nib.as_closest_canonical(nib.load(file)).dataobj) for file in paths]
    assert list(volumes[0].shape)==case['shape']
    checked=[]
    for plane,frames in case['frames'].items():
        chosen={frames[0]['index'],frames[len(frames)//2]['index'],case['change_indices'][plane]}
        for frame in frames:
            for key in ['ct','labels']:assert (ROOT/'frontend/public'/frame[key].lstrip('/')).is_file()
            if frame['index'] not in chosen:continue
            index=frame['index']
            def extract(array):
                if plane=='sagittal':return array[index,:,:].T[::-1,:]
                if plane=='coronal':return array[::-1,index,:].T[::-1,:]
                return array[::-1,:,index].T[::-1,:]
            encoded=np.asarray(Image.open(ROOT/'frontend/public'/frame['ct'].lstrip('/'))).astype(np.int32)
            decoded=encoded[:,:,0]+(encoded[:,:,1]<<8)-32768
            labels=np.asarray(Image.open(ROOT/'frontend/public'/frame['labels'].lstrip('/')))
            assert np.array_equal(decoded,extract(volumes[0])),(case['id'],plane,index,'HU')
            assert np.array_equal(labels[:,:,0],extract(volumes[1])),(case['id'],plane,index,'raw labels')
            assert np.array_equal(labels[:,:,1],extract(volumes[2])),(case['id'],plane,index,'refined labels')
            assert np.count_nonzero(labels[:,:,0]!=labels[:,:,1])==frame['changedPixels']
            checked.append({'plane':plane,'nativeIndex':index,'pixelsExactlyMatchSource':True})
    for stage,url in case['meshes'].items():
        with gzip.open(ROOT/'frontend/public'/url.lstrip('/'),'rt') as stream:bundle=json.load(stream)
        assert set(bundle)==set(map(str,range(1,25)))
        for mesh in bundle.values():
            vertices=np.array(mesh['vertices_ras_mm']);faces=np.array(mesh['faces'])
            if len(vertices):assert np.isfinite(vertices).all() and 0<=faces.min() and faces.max()<len(vertices) and len(faces)<=30000
    report['cases'].append({'id':case['id'],'nativePixels':checked,'allAssetPathsPresent':True,'meshBundlesValid':True})
    print('Pixel provenance passed',case['id'],flush=True)
(ROOT/'artifacts/demo_pixel_verification.json').write_text(json.dumps(report,indent=2)+'\n')
