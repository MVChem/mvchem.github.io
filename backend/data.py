"""Editable bilingual content. Entries describe demo directions, not a résumé."""

from backend.models import Site


BASE = (
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

# Four-language content for the current page structure.
LANGUAGES = ('zh', 'en', 'ja', 'ko')

def T(zh, en, ja, ko):
    return dict(zip(LANGUAGES, (zh, en, ja, ko)))

def P(*entries):
    return {lang: [entry[lang] for entry in entries] for lang in LANGUAGES}

BASE['profile'].update({
    'tagline': T('保持好奇，把想法变成作品。', 'Stay curious. Make ideas real.', '好奇心を、作品に。', '호기심을 작품으로.'),
    'heroLines': P(T('用好奇心', 'With curiosity', '好奇心と', '호기심과'), T('与代码构建', 'and code, build', 'コードでつくる', '코드로 만드는'), T('有趣的互动体验', 'playful experiences', '楽しい体験', '즐거운 경험')),
    'heroTags': P(T('交互设计', 'Interaction design', '体験デザイン', '인터랙션 디자인'), T('工具开发', 'Tool development', 'ツール開発', '도구 개발'), T('AI 探索', 'AI exploration', 'AI の探究', 'AI 탐구')),
    'subheading': T('欢迎来到我的个人主页！', 'Welcome to my personal website!', '私のウェブサイトへようこそ！', '제 개인 홈페이지에 오신 것을 환영합니다!'),
    'intro': P(
        T('这里记录关于代码、创意和交互的一些想法。我想从日常遇到的小问题出发，把模糊的念头变成可以打开、可以体验、也可以继续改进的作品。', 'This is a place for ideas about code, creativity, and interaction. An everyday question can become a small project: something to open, try, and gradually improve.', 'コード、創造性、インタラクションについての考えを記録する場所です。日常の小さな疑問から、開いて試し、少しずつ改良できる作品を考えています。', '코드, 창의성, 인터랙션에 관한 생각을 기록하는 공간입니다. 일상의 작은 질문을 직접 경험하며 조금씩 개선할 수 있는 작품으로 발전시키고 싶습니다.'),
        T('在这个小站里，探索 AI、构建工具和设计互动体验是三个暂时的方向。比起先决定一个宏大的题目，我更愿意从具体的场景开始，观察问题，尝试不同的办法，再记录每一次选择的理由。', 'AI experiments, small tools, and interactive experiences are three starting points for this site. Begin with a specific situation, observe a problem, try a few approaches, and record why each choice was made.', 'AI、小さなツール、インタラクティブな体験が、このサイトの出発点です。具体的な場面を観察し、方法を試して、選択の理由を残していきたいと思います。', 'AI 실험, 작은 도구, 상호작용 경험은 이 사이트의 출발점입니다. 구체적인 상황을 살펴보고 여러 방법을 시도하며 선택의 이유를 기록하고 싶습니다.'),
        T('我也希望作品能把过程讲清楚。一个结果背后有哪些假设，原型是怎样变化的，哪些地方没有达到预期，以及下一步还值得尝试什么，这些细节都应该有自己的位置。它们会让一次探索成为可以继续积累的经验。', 'A project can also explain its process: the assumptions behind it, how a prototype changed, what did not work as expected, and what could come next. Those details make an experiment useful beyond its final result.', '作品と一緒に制作の過程も伝えたいです。前提は何か、試作はどう変わったか、期待どおりにいかなかったことは何か。その記録が次の探究につながります。', '작품과 함께 과정도 설명하고 싶습니다. 어떤 가정에서 시작했는지, 시제품은 어떻게 변했는지, 기대와 달랐던 점과 다음에 시도할 내용을 기록하면 결과 이상의 경험이 남습니다.'),
        T('目前，这个主页展示的是原创示例内容：几个待实现的项目构想，一份可以调整的工具清单，以及用于体验页面交互的小游戏。它们还不是个人履历中的实际成果，之后会逐步替换为真实经历、作品链接与开发记录。', 'For now, the site contains original sample content: project concepts, an editable toolbox, and small games. They are examples rather than a résumé, ready to be replaced with real work, links, and development notes.', '現在はオリジナルのサンプル内容を掲載しています。企画案、ツール一覧、ゲームは経歴や実績を示すものではなく、今後本当の作品や開発記録に置き換えるための例です。', '현재는 독창적인 예시 콘텐츠를 담고 있습니다. 프로젝트 구상, 도구 목록, 작은 게임은 실제 경력이나 성과가 아니라 앞으로 실제 작품과 개발 기록으로 교체할 예시입니다.'),
        T('如果你也喜欢从一个小想法开始动手，可以通过 GitHub 找到我。希望这里会慢慢变成一个值得偶尔回来看看的地方：有新的尝试，有清楚的记录，也保留一点单纯的玩心。', 'If you enjoy starting with a small idea and making something, find me on GitHub. I hope this becomes a place worth revisiting, with experiments, clear notes, and a little room to play.', '小さなアイデアから何かを作るのが好きなら、GitHub でつながりましょう。新しい実験や記録、遊び心のある場所に少しずつ育てていきたいです。', '작은 아이디어로 무언가 만드는 일을 좋아한다면 GitHub에서 만나요. 새로운 실험과 기록, 그리고 약간의 즐거움이 있어 가끔 다시 찾고 싶은 공간으로 만들고 싶습니다.')
    ),
    'stats': [
        {'value': T('3', '3', '3', '3'), 'label': T('示例项目', 'Demo projects', 'サンプル作品', '예시 프로젝트'), 'icon': 'projects'},
        {'value': T('2', '2', '2', '2'), 'label': T('可玩小游戏', 'Mini games', 'ミニゲーム', '미니 게임'), 'icon': 'games'},
        {'value': T('—', '—', '—', '—'), 'label': T('荣誉与奖项', 'Honors & awards', '受賞歴', '수상 경력'), 'icon': 'awards'},
        {'value': T('待补充', 'To be added', '準備中', '추가 예정'), 'label': T('教育背景', 'Education', '学歴', '학력'), 'icon': 'education'},
    ],
})

experience_text = [
    (T('探索 AI', 'Exploring AI', 'AI を探究', 'AI 탐구'), T('AI 实验室', 'AI Lab', 'AI ラボ', 'AI 연구실'), [
        T('从信息整理和重复操作等具体场景出发，设想能够协助完成小任务的智能体原型，并明确它们应该解决的问题与使用边界。', 'Start with information and repetitive tasks, imagining small agents with a clear purpose and scope.', '情報整理や反復作業から、小さなエージェントの目的と範囲を考えます。', '정보 정리와 반복 작업에서 출발해 목적과 범위가 명확한 작은 에이전트를 구상합니다.'),
        T('为一次任务设计清晰的输入、过程和输出，让每一步操作可以被查看和理解，同时保留人工检查与修改结果的空间。', 'Make inputs, steps, and outputs visible, leaving room to inspect and revise the result.', '入力、過程、出力を見える形にし、結果を確認・修正できる余地を残します。', '입력, 과정, 출력을 드러내 결과를 확인하고 수정할 수 있도록 합니다.'),
        T('此处先展示探索方向和计划内容，后续会用真实的实验记录、结果对比与代码链接，补充已经完成的工作和仍然存在的问题。', 'This example will later be replaced with actual experiments, comparisons, and code links.', 'この例は今後、実際の実験記録、比較結果、コードに置き換えます。', '이 예시는 실제 실험 기록, 비교 결과, 코드 링크로 교체할 예정입니다.')
    ]),
    (T('构建工具', 'Building tools', 'ツール制作', '도구 만들기'), T('小工具工坊', 'Tool Studio', 'ツール工房', '도구 공방'), [
        T('从日常操作中寻找值得简化的步骤，尝试把整理文件、转换格式或查看信息等需求，拆解成容易理解和验证的小功能。', 'Find steps worth simplifying and turn everyday file, format, and information tasks into small features.', 'ファイル整理や形式変換などの日常作業を、小さく検証しやすい機能に分けます。', '파일 정리와 형식 변환 같은 일상 작업을 작고 검증 가능한 기능으로 나눕니다.'),
        T('优先考虑使用时的顺畅程度，让页面上的入口、反馈和结果保持一致，也让第一次打开工具的人知道下一步可以做什么。', 'Keep entry points, feedback, and results consistent so first-time visitors can find their next step.', '入口、フィードバック、結果を揃え、初めて使う人にも次の操作を伝えます。', '진입점과 피드백, 결과를 일관되게 구성해 처음 사용하는 사람도 다음 행동을 알 수 있게 합니다.'),
        T('这里的工具方向仍是示例规划，未来可以补充实际仓库、运行截图和使用反馈，逐步说明一个小工具怎样被打磨成型。', 'This example is ready for real repositories, screenshots, and feedback about a tool taking shape.', '実際のリポジトリ、画面、利用者の声を加えるためのサンプルです。', '실제 저장소와 화면, 사용 후기를 추가하기 위한 예시입니다.')
    ]),
    (T('交互实验', 'Interaction experiments', '体験の実験', '인터랙션 실험'), T('交互游乐场', 'Play Studio', '遊びの工房', '인터랙션 공방'), [
        T('通过小型网页实验观察操作与反馈的关系，让按钮、图形和动效对输入作出直接回应，并尝试不同的节奏与表现方式。', 'Explore the relation between input and feedback through small web experiments and playful motion.', '小さなウェブ実験を通じて、入力と反応、動きのリズムを探ります。', '작은 웹 실험과 움직임을 통해 입력과 반응의 관계를 탐구합니다.'),
        T('把规则保持在容易理解的范围内，先验证一种交互是否有趣，再逐步补充细节，同时照顾鼠标、键盘与触屏的使用方式。', 'Begin with a simple rule, test whether it feels good, then consider mouse, keyboard, and touch.', 'シンプルなルールから始め、マウス、キーボード、タッチでの感触を確かめます。', '단순한 규칙에서 시작해 마우스, 키보드, 터치의 조작감을 확인합니다.'),
        T('这些内容目前是可替换的探索方向，真实作品准备好之后，可以在这里展示交互演示、设计过程和关键选择背后的考虑。', 'These are example directions for future demos, design notes, and the reasoning behind key choices.', '今後のデモ、デザイン記録、重要な選択の理由を掲載するための例です。', '향후 데모와 디자인 기록, 중요한 선택의 이유를 담기 위한 예시입니다.')
    ]),
    (T('持续学习', 'Keep learning', '学び続ける', '계속 배우기'), T('日常笔记本', 'Field Notes', '日々のノート', '일상 노트'), [
        T('把阅读、实践和失败的尝试整理成短小的笔记，记录问题出现的背景、当时采用的方法，以及后来发现的更清楚的解释。', 'Keep short notes about reading and experiments, including the context, approach, and later insights.', '読書や実験の背景、方法、その後の気づきを短いノートにまとめます。', '독서와 실험의 배경, 접근 방법, 나중에 얻은 통찰을 짧은 메모로 남깁니다.'),
        T('在不同的主题之间寻找可以连接的地方，用简单的示意和例子重新说明一个概念，让下一次回看时能够更快找到思路。', 'Connect ideas across topics and use small examples to make concepts easier to revisit.', '異なるテーマを結び、小さな例で考えを振り返りやすくします。', '서로 다른 주제를 연결하고 작은 예시로 개념을 다시 살펴보기 쉽게 만듭니다.'),
        T('这里暂时保留示例方向，之后会添加真实的公开笔记、阅读记录和学习项目，让过程本身也成为这个主页的一部分。', 'Actual public notes, reading records, and learning projects can replace this example over time.', '実際の公開ノート、読書記録、学習プロジェクトに順次置き換えます。', '실제 공개 노트와 독서 기록, 학습 프로젝트로 차차 교체할 예정입니다.')
    ]),
]
for entry, (role, organization, description) in zip(BASE['experiences'], experience_text):
    entry.update(role=role, organization=organization, description=P(*description), subtitle=T('示例探索方向', 'Example direction', '探究テーマの例', '탐구 방향 예시'), period=T('示例方向', 'Example direction', 'テーマの例', '방향 예시'))

project_translations = [
    ('エージェント実験室', '에이전트 실험실', 'エージェントの協働を考えるサンプル企画。軌道とノードでタスクのつながりを表します。', '에이전트 협업을 탐구하는 예시 구상입니다. 궤도와 노드로 작업 사이의 연결을 표현합니다.', ['ai', 'development']),
    ('ひらめきの記録', '영감 수집소', 'アイデアや日々のメモを集めるサンプル企画。成長する幾何学の形で、考えの積み重ねを表します。', '아이디어와 일상 메모를 모으는 예시 구상입니다. 자라나는 기하학 형태로 생각이 쌓이는 모습을 표현합니다.', ['design', 'development']),
    ('小さな遊び場', '작은 놀이터', 'シンプルな形の軽やかな変化で、インタラクションを探るサンプル企画です。', '단순한 도형의 경쾌한 변화로 마이크로 인터랙션을 탐구하는 예시 구상입니다.', ['design', 'art']),
]
for project, (ja_sub, ko_sub, ja_desc, ko_desc, categories) in zip(BASE['projects'], project_translations):
    project['title'].update(ja=project['title']['en'], ko=project['title']['en'])
    project['subtitle'].update(ja=ja_sub, ko=ko_sub)
    project['description'].update(ja=ja_desc, ko=ko_desc)
    project.update(categoryIds=categories, year='2026', role=T('示例项目', 'Demo project', 'サンプル作品', '예시 프로젝트'))
    project['details'] = [
        {'heading': T('项目概念', 'The concept', 'コンセプト', '프로젝트 구상'), 'paragraphs': P(project['description'], T('这是一份原创项目构想，用于展示页面布局与内容组织；目前尚未作为真实项目完成，也不代表已经发布的产品。', 'This original concept demonstrates the layout and content structure. It is not a completed project or a released product.', 'このオリジナル企画はレイアウトと情報構造の例です。完成したプロジェクトや公開済み製品ではありません。', '이 독창적인 구상은 페이지 구성과 정보 구조의 예시이며, 완성되거나 출시된 제품이 아닙니다.'))},
        {'heading': T('探索过程', 'The exploration', '探究の過程', '탐구 과정'), 'paragraphs': P(T('先从一个简单的使用场景出发，列出需要回答的问题，再用小规模原型验证信息呈现与操作反馈。后续可以在这里补充真实的草图、实现过程和测试记录。', 'Begin with a simple situation and a few questions. A small prototype can test information and feedback. Real sketches, implementation notes, and test records can follow here.', '単純な利用場面と問いから始め、小さな試作で情報と操作の関係を確かめます。今後、実際のスケッチや実装、検証記録を加えられます。', '간단한 사용 상황과 질문에서 시작해 작은 시제품으로 정보와 반응을 검증합니다. 이후 실제 스케치와 구현 과정, 테스트 기록을 추가할 수 있습니다.'))},
        {'heading': T('下一步', "What's next", 'これから', '다음 단계'), 'paragraphs': P(T('将示例内容替换为真实的项目目标、截图与代码链接，并记录哪些设想经过了验证，哪些问题仍需要继续探索。', 'Replace this example with real goals, images, and code links, documenting what has been tested and what remains open.', 'この例を実際の目標、画像、コードに置き換え、検証した内容と残る課題を記録します。', '이 예시를 실제 목표, 이미지, 코드 링크로 교체하고 검증된 내용과 남은 질문을 기록합니다.'))},
    ]

skill_specs = [
    ('development', T('游戏引擎', 'Game engines', 'ゲームエンジン', '게임 엔진'), ['Unity', 'Unreal Engine', 'Godot'], 3),
    ('development', T('编程语言', 'Languages', 'プログラミング言語', '프로그래밍 언어'), ['Python', 'Java', 'C#', 'SQL', 'C++', 'Kotlin', 'TypeScript', 'HLSL'], 4),
    ('development', T('全栈', 'Full stack', 'フルスタック', '풀스택'), ['Vue', 'Astro', 'HTML', 'CSS', 'JavaScript', 'Three.js', 'Express', 'Springboot', 'Android', 'WordPress', 'React', 'Node.js', 'Oracle SQL', 'Raspberry Pi', 'MATLAB', 'Processing'], 9),
    ('development', T('领域', 'Domains', '分野', '분야'), ['游戏开发', '机器学习', '数据科学', '计算机图形学', '软件工程', 'Web 开发', '信号处理', '计算机视觉', '移动端开发', '数据库管理'], 6),
    ('design', T('游戏设计', 'Game design', 'ゲームデザイン', '게임 디자인'), ['战斗设计', '系统设计', 'UI/UX 设计', '关卡设计'], 3),
    ('design', T('美术', 'Art', 'アート', '아트'), ['Blender', 'Figma', 'Photoshop', 'AE', 'PR', 'Aseprite', 'Nuke', 'Houdini', 'WorldCreator'], 6),
]
BASE['skills'] = [{'category': category, 'label': label, 'items': items, 'proficient': items[:count]} for category, label, items, count in skill_specs]
BASE['about'] = T('保持好奇，享受把一个小小的念头变成作品的过程。这里记录探索，也给新的想法留一点空间。', "Stay curious and enjoy turning a small idea into something real. A place to record experiments and leave room for what's next.", '小さなアイデアを形にする過程を楽しむ。探究を記録し、新しい発想のための余白を残す場所です。', '호기심을 지니고 작은 아이디어를 작품으로 만드는 과정을 즐깁니다. 탐구를 기록하고 새로운 생각을 위한 여백을 남기는 공간입니다.')
BASE['portfolio'] = {
    'intro': P(T('这里是一组围绕交互设计、工具开发、AI 应用与创意编程的原创项目构想。内容暂时以示例呈现，等待真实的作品、截图和开发记录逐步加入。', 'Original concepts across interaction design, tools, AI, and creative coding. These examples leave room for real projects, images, and development notes.', '体験デザイン、ツール、AI、クリエイティブコーディングのオリジナル企画集です。実際の作品や記録を加えるための例を掲載しています。', '인터랙션 디자인, 도구, AI, 크리에이티브 코딩에 관한 독창적인 구상 모음입니다. 현재 예시를 담고 있으며 실제 작품과 개발 기록을 추가할 예정입니다.'), T('一个想法值得动手试一试。先找到具体的问题，再把它变成能被体验的小原型；在操作、观察和修改之间，慢慢找到更合适的表达。', 'An idea is worth trying. Start with a concrete question and a small prototype; interaction, observation, and revision can guide it toward a clearer form.', 'アイデアは試す価値があります。具体的な問いと小さな試作から、操作、観察、修正を通じて形を見つけます。', '아이디어는 직접 시도할 가치가 있습니다. 구체적인 질문과 작은 시제품에서 시작해 조작과 관찰, 수정을 거쳐 알맞은 형태를 찾아갑니다.')),
    'categories': [
        {'id': 'design', 'title': T('交互设计', 'Interaction design', '体験デザイン', '인터랙션 디자인'), 'description': T('从体验出发，思考信息怎样被看见，操作怎样得到回应。这里收集与交互规则、界面结构和视觉节奏有关的示例。', 'Explore how information is seen and actions receive feedback through rules, interfaces, and visual rhythm.', '情報の見え方や操作への反応を、ルール、画面構造、視覚的なリズムから考えます。', '정보가 보이는 방식과 조작에 대한 반응을 규칙, 화면 구조, 시각적 리듬으로 살펴봅니다.'), 'color': '#f66b16', 'projectIds': ['field-notes', 'tiny-playground']},
        {'id': 'development', 'title': T('工具开发', 'Tool development', 'ツール開発', '도구 개발'), 'description': T('用代码把零散步骤组织成清晰的流程，关注可读性、反馈和反复使用时的体验，尝试从小需求构建有用的工具。', 'Organize scattered steps into useful tools, with attention to clarity, feedback, and everyday use.', '小さなニーズから、読みやすさとフィードバックを大切にしたツールを考えます。', '작은 요구에서 출발해 명확성과 피드백, 일상적인 사용 경험을 고려한 도구를 구상합니다.'), 'color': '#005cc5', 'projectIds': ['orbit', 'field-notes']},
        {'id': 'ai', 'title': T('AI 应用探索', 'AI applications', 'AI アプリケーション', 'AI 응용 탐구'), 'description': T('围绕具体任务探索模型与智能体的使用方式，让输入、过程和结果之间的联系更清楚，也为验证和修正保留空间。', 'Explore models and agents through specific tasks, keeping input, process, and result connected.', '具体的なタスクを通して、入力、過程、結果のつながりが見える AI を考えます。', '구체적인 작업을 통해 입력과 과정, 결과의 연결이 드러나는 AI 활용을 탐구합니다.'), 'color': '#8521a1', 'projectIds': ['orbit']},
        {'id': 'art', 'title': T('创意编程', 'Creative coding', 'クリエイティブコーディング', '크리에이티브 코딩'), 'description': T('从几何形状、颜色和运动开始，为简单规则寻找有趣的表达方式，用可以亲手尝试的小实验记录视觉上的发现。', 'Start with shapes, color, and motion, finding playful expressions for simple rules.', '形、色、動きから始め、シンプルなルールの面白い表現を試します。', '도형과 색, 움직임에서 시작해 단순한 규칙을 재미있게 표현하는 방법을 실험합니다.'), 'color': '#f2a100', 'projectIds': ['tiny-playground']},
    ],
}
BASE['aboutPage'] = {
    'greeting': T('你好，我是 MVChem', "Hello, I'm MVChem", 'こんにちは、MVChem です', '안녕하세요, MVChem입니다'),
    'intro': P(T('这里先放一些兴趣和探索方向的示例，后续再补充真实的个人记录。', 'A few examples of interests and things to explore, with room for real personal stories to come.', '興味や探究テーマの例を並べています。これから実際の個人の記録を加えていきます。', '관심사와 탐구 방향의 예시를 담았습니다. 앞으로 실제 개인 기록을 더해 갈 예정입니다.')),
    'sections': [
        {'id': 'play', 'title': T('对交互保持好奇', 'Curious about interaction', '体験への好奇心', '인터랙션에 대한 호기심'), 'tags': P(T('小规则，大变化', 'Small rules, big changes', '小さなルール、大きな変化', '작은 규칙, 큰 변화'), T('从体验开始', 'Start with experience', '体験から始める', '경험에서 시작하기')), 'description': T('一次点击、一次移动，都可以成为一个小实验的起点。', 'A click or a movement can begin a small experiment.', 'クリックや動きが、小さな実験の始まりになります。', '클릭이나 움직임은 작은 실험의 시작이 될 수 있습니다.'), 'kind': 'play'},
        {'id': 'read', 'title': T('给灵感留个位置', 'A place for ideas', 'ひらめきの居場所', '아이디어를 위한 자리'), 'tags': P(T('读一点，记一点', 'Read a little, write a little', '少し読み、少し書く', '조금 읽고 조금 쓰기'), T('连接零散的发现', 'Connect small discoveries', '発見をつなぐ', '작은 발견 연결하기')), 'description': T('把一闪而过的念头写下来，等下一次想法与它相遇。', 'Keep a fleeting thought until another idea comes along to meet it.', '一瞬の思いつきを残し、次のアイデアとの出会いを待ちます。', '스쳐 가는 생각을 적어 두고 다음 아이디어와 만나기를 기다립니다.'), 'kind': 'read'},
        {'id': 'build', 'title': T('享受动手的过程', 'Enjoy making things', 'つくる過程を楽しむ', '만드는 과정 즐기기'), 'tags': P(T('从小问题开始', 'Start with a small question', '小さな問いから', '작은 질문에서 시작하기'), T('边做边学', 'Learn by making', 'つくりながら学ぶ', '만들면서 배우기')), 'description': T('把一个想法拆成可以完成的小步骤，让下一次尝试更加具体。', 'Break an idea into small steps to make the next experiment tangible.', 'アイデアを小さなステップに分け、次の試みを具体的にします。', '아이디어를 작은 단계로 나누어 다음 시도를 구체적으로 만듭니다.'), 'kind': 'build'},
    ],
}
SITE = Site.model_validate(BASE)
