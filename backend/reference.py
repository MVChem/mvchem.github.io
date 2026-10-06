from __future__ import annotations

import json
import hashlib
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ContentModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class TextNode(ContentModel):
    kind: Literal['text']
    text: str


class ElementNode(ContentModel):
    kind: Literal['element']
    tag: str
    attrs: dict[str, str]
    children: list[Annotated[TextNode | ElementNode, Field(discriminator='kind')]]

    @field_validator('tag')
    @classmethod
    def safe_tag(cls, value: str) -> str:
        if value not in {'main', 'article', 'aside', 'section', 'header', 'div', 'span', 'p', 'a',
                         'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'time', 'strong', 'em',
                         'cite', 'br', 'button', 'figure', 'figcaption', 'svg', 'path', 'line',
                         'polyline', 'polygon', 'rect', 'circle', 'g', 'defs', 'clippath', 'i', 'dl', 'dt', 'dd'}:
            raise ValueError('Unsupported content element')
        return value

    @field_validator('attrs')
    @classmethod
    def safe_attributes(cls, attrs: dict[str, str]) -> dict[str, str]:
        for name, value in attrs.items():
            if name.lower().startswith('on'):
                raise ValueError('Event handlers belong in React components')
            if name in {'href', 'src'} and value.strip().lower().startswith(('javascript:', 'data:text/html')):
                raise ValueError('Unsupported URL protocol')
        return attrs


class NavigationItem(ContentModel):
    label: str
    path: str


class ReferenceSite(ContentModel):
    source: str
    captured_at: str
    name: str
    institution: str
    profile: ElementNode
    navigation: list[NavigationItem]
    pages: dict[str, ElementNode]
    documents: dict[Literal['cv', 'resume'], ElementNode]


CONTENT_FILE = Path(__file__).parent / 'content' / 'reference.json'
CONTENT_VERSION = hashlib.sha256(CONTENT_FILE.read_bytes()).hexdigest()[:16]
REFERENCE = ReferenceSite.model_validate(json.loads(CONTENT_FILE.read_text(encoding='utf-8')))
