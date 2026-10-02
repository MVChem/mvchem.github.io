from typing import Literal

from pydantic import BaseModel, ConfigDict


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LocalizedText(Model):
    zh: str
    en: str
    ja: str
    ko: str


class LocalizedParagraphs(Model):
    zh: list[str]
    en: list[str]
    ja: list[str]
    ko: list[str]


class Statistic(Model):
    value: LocalizedText
    label: LocalizedText
    icon: Literal["projects", "games", "awards", "education"]


class Profile(Model):
    name: str
    github: str
    tagline: LocalizedText
    intro: LocalizedParagraphs
    heroLines: LocalizedParagraphs
    heroTags: LocalizedParagraphs
    subheading: LocalizedText
    stats: list[Statistic]


class Experience(Model):
    id: str
    role: LocalizedText
    organization: LocalizedText
    subtitle: LocalizedText
    period: LocalizedText
    description: LocalizedParagraphs
    tags: list[str]
    color: str
    ink: str
    mark: str


class ProjectDetail(Model):
    heading: LocalizedText
    paragraphs: LocalizedParagraphs


class Project(Model):
    id: str
    title: LocalizedText
    subtitle: LocalizedText
    description: LocalizedText
    tags: list[str]
    kind: Literal["orbit", "garden", "play"]
    color: str
    ink: str
    categoryIds: list[str]
    year: str
    role: LocalizedText
    details: list[ProjectDetail]


class Skill(Model):
    category: Literal["development", "design"]
    label: LocalizedText
    items: list[str]
    proficient: list[str]


class PortfolioCategory(Model):
    id: str
    title: LocalizedText
    description: LocalizedText
    color: str
    projectIds: list[str]


class Portfolio(Model):
    intro: LocalizedParagraphs
    categories: list[PortfolioCategory]


class AboutSection(Model):
    id: str
    title: LocalizedText
    tags: LocalizedParagraphs
    description: LocalizedText
    kind: Literal["play", "read", "build"]


class AboutPage(Model):
    greeting: LocalizedText
    sections: list[AboutSection]
    intro: LocalizedParagraphs


class Site(Model):
    profile: Profile
    experiences: list[Experience]
    projects: list[Project]
    skills: list[Skill]
    about: LocalizedText
    portfolio: Portfolio
    aboutPage: AboutPage
