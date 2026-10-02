from typing import Literal

from pydantic import BaseModel, ConfigDict


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LocalizedText(Model):
    zh: str
    en: str


class LocalizedParagraphs(Model):
    zh: list[str]
    en: list[str]


class Profile(Model):
    name: str
    github: str
    tagline: LocalizedText
    intro: LocalizedParagraphs


class Experience(Model):
    id: str
    role: LocalizedText
    organization: LocalizedText
    period: LocalizedText
    description: LocalizedParagraphs
    tags: list[str]
    color: str
    ink: str
    mark: str


class Project(Model):
    id: str
    title: LocalizedText
    subtitle: LocalizedText
    description: LocalizedText
    tags: list[str]
    kind: Literal["orbit", "garden", "play"]
    color: str
    ink: str


class Skill(Model):
    label: LocalizedText
    items: list[str]


class Site(Model):
    profile: Profile
    experiences: list[Experience]
    projects: list[Project]
    skills: list[Skill]
    about: LocalizedText
