# 储红康个人主页 · chuhongkang.com

沿用用户选定的 [chenfangcs.com](https://www.chenfangcs.com/) 布局、字体和交互，个人资料已替换为储红康（Hongkang Chu）。照片区域暂时留空。

项目保存位置：`/home/data2/chk/workspace/2026/10/01/chenfang-homepage`。

## 页面和交互

- About：本人介绍、研究经历、可滚动的真实研究新闻和精选论文。
- Research：中科院 / 国科大、浙大合作、UIUC 远程研究实习和本科研究经历，以及本人研究概要。
- Publications：TRACE、ClueAegis、MRL、赵传文一作的 JPCL、本人一作的 ISMRM 2026 Power Pitch 和本科 IJMS 论文；保留完整作者顺序和明确状态。
- Projects：三个已有公开成果的研究项目。
- CV：本站公开内容生成的两页 CV 与一页 Resume，支持键盘切换、预览、打开与下载；不复制申请材料中的 CV。
- Teaching / Personal：暂无本人确认的内容，不出现在导航；旧网址保留空状态。

桌面保留固定资料栏，手机首页显示紧凑资料区，其他手机页面聚焦正文。导航支持手机菜单、Escape 关闭、历史返回和研究段落锚点。页面使用 React + TypeScript + Vite；FastAPI 的 `/api/reference.json` 提供经过 Pydantic 验证的内容数据。兼容入口 `/api/site.json` 返回同一份本人内容，旧的演示数据不再发布。

本人要求不公开的病例报告代理相关工作不进入网页、元数据、PDF、预览和下载附件。包含相关内容的旧 MDLE 演示附件已从网站发布目录移除，工作区原材料保持独立。

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
.venv/bin/python scripts/build_personal_content.py
npm --prefix frontend run build
.venv/bin/python scripts/export_static.py
```

构建后可通过 [http://localhost:8038](http://localhost:8038) 直接访问 FastAPI 提供的页面。

静态导出包含本人栏目入口、API 数据快照、`404.html` 和 `.nojekyll`，可放到 GitHub Pages。`frontend/public/CNAME` 保留域名 `chuhongkang.com`。GitHub Pages 在线上读取静态数据快照，FastAPI 用于本地开发和导出。

本项目的发布脚本仅接受 `MVChem/mvchem.github.io` 仓库，保留 `gh-pages` 历史和现有域名配置。发布前先检查构建内容：

```bash
.venv/bin/python scripts/publish.py
```

## 内容和文件

- `frontend/src/App.tsx`：导航、路由、手机菜单、CV 切换。
- `frontend/src/components/ReferenceDocument.tsx`：正文、新闻滚动、首页扫描动画。
- `frontend/src/styles.css`：参考网站样式。
- `backend/content/public_profile.json`：唯一公开内容编辑源，含本人资料、经历及允许公开的论文。
- `scripts/build_personal_content.py`：从公开内容生成网页、两页 CV、一页 Resume 和预览。
- `backend/content/reference.json`：生成的语义页面数据；不要单独编辑。
- `backend/content/documents/`：可复现的公开 CV 和 Resume LaTeX 源文件。
- `frontend/public/`：公开 PDF、预览、字体、图标和域名配置。
- `SOURCE_NOTICE.md`：参考内容和素材来源。

源代码位于 `feat/chenfang-homepage` 分支，静态构建发布到 `gh-pages`。原主页和参考作者版本保留在 Git 历史中。

## 检查

```bash
npm --prefix frontend run build
.venv/bin/python -m unittest backend.test_app -v
.venv/bin/python -m pip install -r backend/requirements-dev.txt
.venv/bin/python scripts/verify_replica.py http://127.0.0.1:5178
```

浏览器检查使用已安装的 `/usr/bin/google-chrome`，覆盖五个导航栏目和两个旧链接、360/390/768/960/1440 像素宽度、新闻滚动、CV 切换、PDF、手机菜单与历史返回。截图和结果输出到 `artifacts/`。后端检查另核对公开数据、留空头像及 PDF 的公开范围。
