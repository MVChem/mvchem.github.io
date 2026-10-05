# Chen Fang 首页完整复刻

按 [chenfangcs.com](https://www.chenfangcs.com/) 的布局、字体、配色、照片、文字和交互制作的参考版本。用户明确要求这一版先完整复刻，个人资料暂时保留参考作者内容。

项目保存位置：`/home/data2/chk/workspace/2026/10/01/chenfang-homepage`。

## 页面和交互

- About：个人介绍、首页扫描动画、可滚动的新闻、荣誉和精选论文。
- Research：八项研究及原始链接、配图和文档。
- Publications：五篇论文与状态标签。
- Teaching：课程和助教经历。
- Projects：应用介绍、功能列表与项目图。
- CV：CV / Resume 切换、键盘操作、PDF 预览、打开与下载。
- Personal：个人兴趣、品牌、旅行地图与滑雪照片。

桌面保留固定资料栏，手机首页显示紧凑资料区，其他手机页面聚焦正文。导航支持手机菜单、Escape 关闭、历史返回和研究段落锚点。页面使用 React + TypeScript + Vite；FastAPI 的 `/api/reference.json` 提供经过 Pydantic 验证的内容数据。

## 本地运行

首次安装依赖：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm --prefix frontend ci --include=dev
```

在项目目录启动后端：

```bash
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8038
```

另一个终端启动前端：

```bash
npm --prefix frontend run dev
```

访问 [http://localhost:5178](http://localhost:5178)。Vite 会将 `/api` 请求转给 FastAPI。

## 构建和静态发布

```bash
npm --prefix frontend run build
.venv/bin/python scripts/export_static.py
```

构建后可通过 [http://localhost:8038](http://localhost:8038) 直接访问 FastAPI 提供的页面。

静态导出包含所有栏目入口、API 数据快照、`404.html` 和 `.nojekyll`，可放到 GitHub Pages。`frontend/public/CNAME` 保留域名 `chuhongkang.com`。GitHub Pages 在线上读取静态数据快照，FastAPI 用于本地开发和导出。

本项目的发布脚本仅接受 `MVChem/mvchem.github.io` 仓库，保留 `gh-pages` 历史和现有域名配置。发布前先检查构建内容：

```bash
.venv/bin/python scripts/publish.py
```

## 内容和文件

- `frontend/src/App.tsx`：导航、路由、手机菜单、CV 切换。
- `frontend/src/components/ReferenceDocument.tsx`：正文、新闻滚动、首页扫描动画。
- `frontend/src/styles.css`：参考网站样式。
- `backend/content/reference.json`：这一版的资料与页面内容。
- `frontend/public/`：本地照片、论文配图、PDF、缩略图和字体。
- `SOURCE_NOTICE.md`：参考内容和素材来源。

本次改动位于 `feat/chenfang-homepage` 分支，并同步到主分支发布。原主页保留在 Git 历史中，修改前的源码提交为 `d987257`。

## 检查

```bash
npm --prefix frontend run build
.venv/bin/python -m unittest backend.test_app -v
.venv/bin/python -m pip install -r backend/requirements-dev.txt
.venv/bin/python scripts/verify_replica.py http://127.0.0.1:5178
```

浏览器检查使用已安装的 `/usr/bin/google-chrome`，覆盖七个栏目、360/390/768/960/1440 像素宽度、新闻滚动、CV 切换、PDF、手机菜单与历史返回。截图和结果输出到 `artifacts/`。
