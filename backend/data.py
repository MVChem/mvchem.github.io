"""Editable bilingual content. Entries describe demo directions, not a résumé."""

from backend.models import Site


SITE = Site.model_validate(
    {
        "profile": {
            "name": "MVChem",
            "github": "https://github.com/MVChem",
            "tagline": {
                "zh": "保持好奇，把想法变成作品。",
                "en": "Stay curious. Make ideas real.",
            },
            "intro": {
                "zh": [
                    "欢迎来到我的数字小天地。这里用来记录探索、分享作品，也为下一个有趣的想法留一点空间。",
                    "这是一版正在生长的个人主页。下方展示的是示例探索方向与演示项目，真实经历和作品会在这里慢慢补全。",
                ],
                "en": [
                    "Welcome to my little corner of the internet: a place for experiments, things to share, and whatever comes next.",
                    "This site is a work in progress. The directions and projects below are examples, ready to be replaced with real experiences and work.",
                ],
            },
        },
        "experiences": [
            {
                "id": "exploring-ai",
                "role": {"zh": "探索 AI", "en": "Exploring AI"},
                "organization": {"zh": "从一个好问题开始", "en": "Start with a good question"},
                "period": {"zh": "示例方向 · 01", "en": "Example direction · 01"},
                "description": {
                    "zh": ["尝试把模型能力放进具体的小场景：整理信息、协助思考，或让重复工作变得简单。", "此处为示例探索方向，可替换为真实的研究或实践经历。"],
                    "en": ["Explore small, practical uses for models: organizing information, supporting ideas, and simplifying repetitive tasks.", "This is an example direction, ready for a real research or practice entry."],
                },
                "tags": ["AI", "Agents", "Experiments"],
                "color": "#f0edf9",
                "ink": "#68538b",
                "mark": "✳",
            },
            {
                "id": "building-tools",
                "role": {"zh": "构建工具", "en": "Building tools"},
                "organization": {"zh": "让日常多一点顺手", "en": "Make everyday work easier"},
                "period": {"zh": "示例方向 · 02", "en": "Example direction · 02"},
                "description": {
                    "zh": ["从自己的需求出发，设想轻量、直接、容易使用的小工具。", "此处为示例探索方向，可补充实际工具、代码仓库和使用反馈。"],
                    "en": ["Start with an everyday need and imagine a small tool that feels straightforward to use.", "This is an example direction; add real tools, repositories, and user feedback here."],
                },
                "tags": ["Python", "Web", "Open Source"],
                "color": "#e9f2ef",
                "ink": "#467266",
                "mark": "↗",
            },
            {
                "id": "interaction-experiments",
                "role": {"zh": "交互实验", "en": "Interaction experiments"},
                "organization": {"zh": "给想法一个看得见的形状", "en": "Give an idea a visible shape"},
                "period": {"zh": "示例方向 · 03", "en": "Example direction · 03"},
                "description": {
                    "zh": ["通过页面、动效和可视化，探索信息怎样呈现得更清楚，也更有趣。", "此处为示例探索方向，后续可放入真实的设计与交互作品。"],
                    "en": ["Explore pages, motion, and visualization to make information clearer and a little more playful.", "This is an example direction, with room for real design and interaction projects."],
                },
                "tags": ["React", "Interaction", "Visualization"],
                "color": "#f9efdf",
                "ink": "#997036",
                "mark": "◈",
            },
            {
                "id": "keep-learning",
                "role": {"zh": "持续学习", "en": "Always learning"},
                "organization": {"zh": "记录过程，也分享发现", "en": "Keep notes. Share discoveries."},
                "period": {"zh": "示例方向 · 04", "en": "Example direction · 04"},
                "description": {
                    "zh": ["把零散的阅读、尝试和思考整理成笔记，让下一次探索有迹可循。", "此处为示例探索方向，适合补充学习记录或公开分享。"],
                    "en": ["Turn scattered reading, experiments, and thoughts into notes to revisit and build on.", "This is an example direction for learning notes or public writing."],
                },
                "tags": ["Notes", "Curiosity", "Sharing"],
                "color": "#eaf0fa",
                "ink": "#526f98",
                "mark": "⌘",
            },
        ],
        "projects": [
            {
                "id": "orbit",
                "title": {"zh": "Orbit", "en": "Orbit"},
                "subtitle": {"zh": "智能体实验室", "en": "An agent laboratory"},
                "description": {
                    "zh": "一个探索智能体协作的演示方案。用轨道与节点呈现任务之间的联系，为后续真实项目预留位置。",
                    "en": "A demo concept for exploring agent collaboration. Orbits and nodes visualize connected tasks, ready for a real project to take their place.",
                },
                "tags": ["AI", "Agents", "Concept"],
                "kind": "orbit",
                "color": "#eeeaf8",
                "ink": "#726098",
            },
            {
                "id": "field-notes",
                "title": {"zh": "Field Notes", "en": "Field Notes"},
                "subtitle": {"zh": "灵感收集站", "en": "A home for small discoveries"},
                "description": {
                    "zh": "一个收集灵感与日常笔记的演示方案。以生长的几何形状表达想法积累，内容待替换为真实作品。",
                    "en": "A demo concept for collecting ideas and everyday notes. Growing geometric forms suggest ideas accumulating; real work can replace this entry.",
                },
                "tags": ["Notes", "Knowledge", "Concept"],
                "kind": "garden",
                "color": "#e7f0e9",
                "ink": "#537d5d",
            },
            {
                "id": "tiny-playground",
                "title": {"zh": "Tiny Playground", "en": "Tiny Playground"},
                "subtitle": {"zh": "交互游乐场", "en": "A little room to play"},
                "description": {
                    "zh": "一个关于微交互和视觉实验的演示方案。让简单形状产生轻快的变化，后续可放入可体验的真实项目。",
                    "en": "A demo concept for microinteractions and visual experiments. Simple shapes invite playful changes, with room for a real interactive project later.",
                },
                "tags": ["Creative Coding", "Interaction", "Concept"],
                "kind": "play",
                "color": "#f9eddf",
                "ink": "#b17c45",
            },
        ],
        "skills": [
            {"label": {"zh": "构建与实验", "en": "Build & experiment"}, "items": ["Python", "TypeScript", "React", "FastAPI"]},
            {"label": {"zh": "探索与表达", "en": "Explore & express"}, "items": ["AI", "Creative Coding", "Visualization", "Writing"]},
            {"label": {"zh": "工具与协作", "en": "Tools & collaboration"}, "items": ["Git", "GitHub", "Open Source", "Markdown"]},
        ],
        "about": {
            "zh": "这个小站还在慢慢搭建。探索方向、项目与技能标签均为首版示例，期待用真实的经历、作品和故事逐一填满。",
            "en": "This little site is still taking shape. Directions, projects, and skill tags are starter examples, waiting for real experiences, work, and stories.",
        },
    }
)
