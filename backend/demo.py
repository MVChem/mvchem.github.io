"""Validated public snapshots generated from the completed research warmup."""
from pathlib import Path
from typing import Literal
import json
from pydantic import BaseModel, ConfigDict, Field, field_validator

CONTENT = Path(__file__).parent/'content/vertebrae_demo.json'

class Frame(BaseModel):
    index: int = Field(ge=0)
    ct: str
    labels: str
    widthMm: float = Field(gt=0)
    heightMm: float = Field(gt=0)
    changedPixels: int = Field(ge=0)

    @field_validator('ct', 'labels')
    @classmethod
    def public_asset(cls, value: str) -> str:
        if not value.startswith('/demo-data/vertebrae/') or '..' in value:
            raise ValueError('Demo assets must stay in the public demo folder')
        return value

class DemoCase(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str = Field(pattern=r'^BDMAP_\d{8}$')
    before_components: int = Field(ge=0)
    after_components: int = Field(ge=0)
    changed_voxels: int = Field(ge=0)
    labels: list[dict]
    frames: dict[Literal['sagittal','coronal','axial'],list[Frame]]
    meshes: dict[Literal['raw','refined'],str]

class DemoManifest(BaseModel):
    model_config = ConfigDict(extra='allow')
    version: str = Field(pattern=r'^[0-9a-f]{16}$')
    author: Literal['Hongkang Chu']
    groundTruthAvailable: Literal[False]
    cases: list[DemoCase] = Field(min_length=2,max_length=2)
    downloads: dict[str,str]

def load_manifest() -> DemoManifest:
    return DemoManifest.model_validate(json.loads(CONTENT.read_text()))
