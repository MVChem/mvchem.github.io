#!/usr/bin/env python3
"""Conservative, auditable SuPreM vertebrae refinement on the ORIGINAL voxel grid.

Default: remove only non-boundary 26-connected satellites <= 1% of their label's
largest component AND >= 3 mm from that component. These are engineering
heuristics, not clinically validated cutoffs. No relabeling, dilation or bridging.
--conservative keeps all components (audit-only baseline). Hole filling is OFF
unless --fill-holes-mm3 is explicitly provided; only fully enclosed background
cavities up to that physical volume are eligible. No ground-truth claim is made.
"""
from __future__ import annotations
import argparse
import ast
import hashlib
import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parent
LABEL_SOURCE = ROOT / 'vendor/SuPreM/direct_inference/dataset/dataloader_test.py'
# Verified against upstream commit 7583213147e33daf2031cc0a3ad30faa516f4f64.
EMBEDDED_LABEL_MAP = {1: 'vertebrae_L5', 2: 'vertebrae_L4', 3: 'vertebrae_L3', 4: 'vertebrae_L2', 5: 'vertebrae_L1', 6: 'vertebrae_T12', 7: 'vertebrae_T11', 8: 'vertebrae_T10', 9: 'vertebrae_T9', 10: 'vertebrae_T8', 11: 'vertebrae_T7', 12: 'vertebrae_T6', 13: 'vertebrae_T5', 14: 'vertebrae_T4', 15: 'vertebrae_T3', 16: 'vertebrae_T2', 17: 'vertebrae_T1', 18: 'vertebrae_C7', 19: 'vertebrae_C6', 20: 'vertebrae_C5', 21: 'vertebrae_C4', 22: 'vertebrae_C3', 23: 'vertebrae_C2', 24: 'vertebrae_C1'}
CONNECTIVITY = ndi.generate_binary_structure(3, 3)

@dataclass(frozen=True)
class Parameters:
    max_component_fraction: float = 0.01
    min_distance_mm: float = 3.0
    fill_holes_mm3: float = 0.0
    conservative: bool = False

    def validate(self):
        if not 0 <= self.max_component_fraction <= 0.1:
            raise ValueError('max_component_fraction must be between 0 and 0.1')
        if not np.isfinite(self.min_distance_mm) or self.min_distance_mm < 0:
            raise ValueError('min_distance_mm must be finite and nonnegative')
        if not np.isfinite(self.fill_holes_mm3) or self.fill_holes_mm3 < 0:
            raise ValueError('fill_holes_mm3 must be finite and nonnegative')


def load_label_map(source: Path = LABEL_SOURCE) -> dict[int, str]:
    """Read a literal from upstream AST; do not import its model dependencies."""
    if source == LABEL_SOURCE and not source.is_file():
        return EMBEDDED_LABEL_MAP.copy()
    tree = ast.parse(source.read_text())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'class_map_part_vertebrae' for t in node.targets):
            mapping = ast.literal_eval(node.value)
            if not mapping or any(not isinstance(k, int) or k <= 0 or not isinstance(v, str) or not v.startswith('vertebrae_') or '/' in v for k, v in mapping.items()):
                raise ValueError('Invalid upstream vertebrae label map')
            return dict(sorted(mapping.items()))
    raise ValueError(f'No class_map_part_vertebrae in {source}')


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def affine_mm(image: nib.Nifti1Image) -> np.ndarray:
    unit = image.header.get_xyzt_units()[0]
    # Upstream NIfTI masks sometimes have unknown units. SuPreM's CT affine is
    # in mm; explicit unknown handling is recorded in the case report.
    scale = {'mm': 1.0, 'meter': 1000.0, 'micron': 0.001, 'unknown': 1.0}.get(unit)
    if scale is None:
        raise ValueError(f'Unsupported spatial unit: {unit}')
    affine = np.array(image.affine, dtype=float, copy=True)
    affine[:3, :] *= scale
    if not np.isfinite(affine).all() or abs(np.linalg.det(affine[:3, :3])) < 1e-12:
        raise ValueError('Nonfinite or singular affine')
    return affine


def validate_geometry(ct: nib.Nifti1Image, prediction: nib.Nifti1Image):
    if len(ct.shape) != 3 or len(prediction.shape) != 3:
        raise ValueError('CT and labels must both be 3D NIfTI volumes')
    if ct.shape != prediction.shape:
        raise ValueError(f'Shape mismatch: CT {ct.shape}, labels {prediction.shape}')
    if not np.allclose(affine_mm(ct), affine_mm(prediction), atol=1e-4, rtol=1e-6):
        raise ValueError('CT/labels affine mismatch; automatic resampling is intentionally disabled')


def touches_boundary(coords: np.ndarray, shape: tuple[int, ...]) -> bool:
    return bool(np.any(coords == 0) or np.any(coords == np.asarray(shape) - 1))


def refine_array(raw: np.ndarray, physical_affine: np.ndarray, mapping: dict[int, str], params: Parameters):
    params.validate()
    if raw.ndim != 3 or not np.issubdtype(raw.dtype, np.integer):
        raise ValueError('Labels must be a 3D integer array')
    unknown = set(int(v) for v in np.unique(raw)) - {0, *mapping}
    if unknown:
        raise ValueError(f'Unknown label IDs: {sorted(unknown)}')
    voxel_mm3 = float(abs(np.linalg.det(physical_affine[:3, :3])))
    if not np.isfinite(voxel_mm3) or voxel_mm3 <= 0:
        raise ValueError('Invalid voxel volume')
    refined = raw.copy()
    boxes = ndi.find_objects(raw, max_label=max(mapping))
    metrics = []
    for label_id, name in mapping.items():
        box = boxes[label_id - 1] if label_id <= len(boxes) else None
        row = {'id': label_id, 'name': name, 'before_voxels': 0, 'after_voxels': 0,
               'before_components': 0, 'after_components': 0, 'removed_voxels': 0,
               'added_voxels': 0, 'before_volume_ml': 0.0, 'after_volume_ml': 0.0,
               'centroid_ras_mm': None, 'flags': [], 'components': []}
        if box is None:
            row['flags'] = ['not_predicted_in_scan']
            metrics.append(row)
            continue
        offset = np.array([s.start for s in box])
        mask = raw[box] == label_id
        components, count = ndi.label(mask, CONNECTIVITY)
        sizes = np.bincount(components.ravel())
        primary_id = int(np.argmax(sizes[1:]) + 1)
        primary = components == primary_id
        surface = primary & ~ndi.binary_erosion(primary, structure=CONNECTIVITY, border_value=0)
        primary_world = nib.affines.apply_affine(physical_affine, np.argwhere(surface) + offset)
        tree = cKDTree(primary_world) if count > 1 else None
        view = refined[box]
        row['before_voxels'] = int(mask.sum())
        row['before_components'] = int(count)
        component_boxes = ndi.find_objects(components)
        for component_id, component_box in enumerate(component_boxes, 1):
            if component_box is None:
                continue
            local_offset = np.array([s.start for s in component_box])
            coords = np.argwhere(components[component_box] == component_id) + local_offset + offset
            boundary = touches_boundary(coords, raw.shape)
            size = int(sizes[component_id])
            fraction = float(size / sizes[primary_id])
            distance = None
            remove = False
            if component_id != primary_id:
                assert tree is not None
                distance = float(tree.query(nib.affines.apply_affine(physical_affine, coords), k=1)[0].min())
                remove = (not params.conservative and not boundary and fraction <= params.max_component_fraction and distance >= params.min_distance_mm)
            if remove:
                view[components == component_id] = 0
            elif boundary:
                if 'scan_boundary_component_preserved' not in row['flags']:
                    row['flags'].append('scan_boundary_component_preserved')
            row['components'].append({'voxels': size, 'volume_mm3': size * voxel_mm3,
                                     'fraction_of_largest': fraction, 'distance_to_largest_mm': distance,
                                     'touches_scan_boundary': boundary, 'action': 'removed' if remove else 'preserved'})
        if params.fill_holes_mm3 > 0 and not params.conservative:
            # Pad the label ROI so cavities remain genuinely enclosed; preserve
            # any competing label inside a cavity rather than overwrite it.
            kept = view == label_id
            padded = np.pad(kept, 1)
            candidates = (ndi.binary_fill_holes(padded)[1:-1, 1:-1, 1:-1] & ~kept)
            holes, hole_count = ndi.label(candidates, CONNECTIVITY)
            for hole_id in range(1, hole_count + 1):
                hole = holes == hole_id
                if hole.sum() * voxel_mm3 <= params.fill_holes_mm3 and np.all(raw[box][hole] == 0):
                    view[hole] = label_id
        after = view == label_id
        row['after_voxels'] = int(after.sum())
        row['removed_voxels'] = int((mask & ~after).sum())
        row['added_voxels'] = int((after & ~mask).sum())
        row['after_components'] = int(ndi.label(after, CONNECTIVITY)[1])
        row['before_volume_ml'] = row['before_voxels'] * voxel_mm3 / 1000
        row['after_volume_ml'] = row['after_voxels'] * voxel_mm3 / 1000
        if after.any():
            row['centroid_ras_mm'] = nib.affines.apply_affine(physical_affine, np.argwhere(after).mean(axis=0) + offset).tolist()
        if row['after_components'] > 1:
            row['flags'].append('remaining_disconnected_components')
        if row['removed_voxels'] > row['before_voxels'] * 0.02:
            row['flags'].append('removal_exceeds_2_percent_review')
        metrics.append(row)
    # Label order is a review cue only. Never use z sorting to change identities.
    present = [row for row in metrics if row['centroid_ras_mm'] is not None]
    for inferior, superior in zip(present, present[1:]):
        if superior['centroid_ras_mm'][2] <= inferior['centroid_ras_mm'][2]:
            inferior['flags'].append('centroid_order_review')
            superior['flags'].append('centroid_order_review')
    return refined, metrics


def save_like(data: np.ndarray, original: nib.Nifti1Image, destination: Path):
    header = original.header.copy()
    header.set_data_dtype(data.dtype)
    image = original.__class__(data, original.affine.copy(), header=header)
    # Retain both transform codes/matrices, including uncoded qform/sform.
    for kind in ('qform', 'sform'):
        matrix, code = getattr(original, f'get_{kind}')(coded=True)
        getattr(image, f'set_{kind}')(matrix, int(code))
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name.replace('.nii.gz', '.partial.nii.gz'))
    nib.save(image, temporary)
    os.replace(temporary, destination)


def atomic_json(destination: Path, content):
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix('.partial.json')
    temporary.write_text(json.dumps(content, indent=2, allow_nan=False) + '\n')
    os.replace(temporary, destination)


def process_case(case_dir: Path, ct_dir: Path, output_dir: Path, mapping: dict[int, str], params: Parameters):
    raw_path = case_dir / 'combined_labels.nii.gz'
    ct_path = ct_dir / case_dir.name / 'ct.nii.gz'
    if not ct_path.is_file():
        raise ValueError(f'Missing CT: {ct_path}')
    ct, prediction = nib.load(ct_path), nib.load(raw_path)
    validate_geometry(ct, prediction)
    raw = np.asanyarray(prediction.dataobj)
    if not np.issubdtype(raw.dtype, np.integer) or prediction.get_data_dtype() != raw.dtype:
        raise ValueError('Labels must use unscaled integer storage; cannot preserve nontrivial NIfTI scaling')
    physical = affine_mm(prediction)
    refined, metrics = refine_array(raw, physical, mapping, params)
    case_output = output_dir / case_dir.name
    if case_output.resolve() == case_dir.resolve():
        raise ValueError('Output must be separate from raw inference')
    case_output.mkdir(parents=True, exist_ok=True)
    # Completion marker is written LAST. Remove a stale marker on reruns so the
    # UI cannot mistake an in-progress replacement for a complete case.
    (case_output / 'metrics.json').unlink(missing_ok=True)
    save_like(refined, prediction, case_output / 'combined_labels.nii.gz')
    for label_id, name in mapping.items():
        template_path = case_dir / 'segmentations' / f'{name}.nii.gz'
        template = nib.load(template_path) if template_path.exists() else prediction
        validate_geometry(ct, template)
        dtype = template.get_data_dtype() if template_path.exists() else np.dtype('uint8')
        save_like((refined == label_id).astype(dtype), template, case_output / 'segmentations' / f'{name}.nii.gz')
    report = {'case_id': case_dir.name, 'created_utc': datetime.now(timezone.utc).isoformat(),
              'parameters': asdict(params), 'shape': list(raw.shape), 'affine': prediction.affine.tolist(),
              'orientation': list(nib.aff2axcodes(prediction.affine)),
              'spatial_units': prediction.header.get_xyzt_units()[0],
              'unit_note': 'Unknown spatial units treated as millimetres, consistent with upstream CT affine' if prediction.header.get_xyzt_units()[0] == 'unknown' else None,
              'voxel_volume_mm3': float(abs(np.linalg.det(physical[:3, :3]))),
              'raw_sha256': sha256(raw_path), 'ct_sha256': sha256(ct_path),
              'refined_sha256': sha256(case_output / 'combined_labels.nii.gz'),
              'changed_voxels': int(np.count_nonzero(raw != refined)),
              'removed_voxels': sum(row['removed_voxels'] for row in metrics),
              'added_voxels': sum(row['added_voxels'] for row in metrics),
              'before_components': sum(row['before_components'] for row in metrics),
              'after_components': sum(row['after_components'] for row in metrics),
              'labels': metrics,
              'limitations': ['No ground truth: component reduction is not an accuracy measure.',
                              'Large artifacts, connected leakage, missing anatomy and wrong label identities may remain.',
                              'Boundary components are retained; they may include artifacts.',
                              'No identity reassignment, model retraining, or clinical validation.']}
    atomic_json(case_output / 'metrics.json', report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--input-dir', type=Path, default=ROOT / 'results/raw')
    parser.add_argument('--ct-dir', type=Path, default=ROOT / 'data/AbdomenAtlasDemo')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'results/AbdomenAtlasDemoPredict')
    parser.add_argument('--label-source', type=Path, default=LABEL_SOURCE)
    parser.add_argument('--conservative', action='store_true', help='Audit-only baseline: preserve all voxels')
    parser.add_argument('--max-component-fraction', type=float, default=0.01)
    parser.add_argument('--min-distance-mm', type=float, default=3.0)
    parser.add_argument('--fill-holes-mm3', type=float, default=0.0)
    args = parser.parse_args()
    params = Parameters(args.max_component_fraction, args.min_distance_mm, args.fill_holes_mm3, args.conservative)
    params.validate()
    mapping = load_label_map(args.label_source)
    cases = sorted(args.input_dir.glob('*/combined_labels.nii.gz'))
    if not cases:
        parser.error(f'No authentic raw predictions in {args.input_dir}; run SuPreM inference first')
    if args.output_dir.resolve() == args.input_dir.resolve() or args.output_dir.resolve() == args.ct_dir.resolve():
        parser.error('Output directory must be separate from inputs')
    summary = {'created_utc': datetime.now(timezone.utc).isoformat(), 'parameters': asdict(params),
               'label_source': str(args.label_source) if args.label_source.is_file() else 'embedded upstream label map', 'label_source_sha256': sha256(args.label_source) if args.label_source.is_file() else hashlib.sha256(json.dumps(mapping, sort_keys=True).encode()).hexdigest(),
               'label_map': mapping, 'cases': [], 'errors': [], 'ground_truth_available': False}
    for raw_path in cases:
        try:
            report = process_case(raw_path.parent, args.ct_dir, args.output_dir, mapping, params)
            summary['cases'].append({key: report[key] for key in ['case_id', 'changed_voxels', 'removed_voxels', 'added_voxels', 'before_components', 'after_components']})
            print(f"{report['case_id']}: {report['before_components']} → {report['after_components']} components; {report['changed_voxels']} changed voxels", flush=True)
        except (ValueError, OSError) as error:
            summary['errors'].append({'case_id': raw_path.parent.name, 'error': str(error)})
            print(f'ERROR {raw_path.parent.name}: {error}', flush=True)
    atomic_json(args.output_dir / 'summary.json', summary)
    if summary['errors']:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
