# 储红康个人主页 · chuhongkang.com

沿用用户选定的 [chenfangcs.com](https://www.chenfangcs.com/) 布局、字体和交互，个人资料已替换为储红康（Hongkang Chu）。头像使用本人提供的 `frontend/public/photos/chuhongkang-centered.png`，在桌面 224px、手机 112px 的圆形区域中采用突出脸部的大头照裁切，原图保持不变。

项目保存位置：`/home/data2/chk/workspace/2026/10/01/chenfang-homepage`。

## 页面和交互

- About：本人介绍、研究经历、可滚动的真实研究新闻和精选论文。
- Research：中科院 / 国科大、浙大合作、UIUC 远程研究实习和本科研究经历，以及本人研究概要。
- Publications：TRACE、ClueAegis、MRL、赵传文一作的 JPCL、本人一作的 ISMRM 2026 Power Pitch Oral 和本科 IJMS 论文；保留完整作者顺序和明确状态。
- Projects：Vertebrae Study 和三个已有公开成果的研究项目，以后可继续加入其他领域的项目。
- Vertebrae Study：`/projects/vertebrae/` 的椎骨分割研究展示，副标题为 SuPreM vertebrae segmentation and postprocessing。包含两例官方CT的前后对比、改动定位、窗宽窗位、标签筛选、真实3D曲面和逐椎骨统计。任务来源注明 JHU 的 Zongwei Zhou 实验室和 SuPreM / AbdomenAtlasDemo；明确区分后处理改动与准确率评价。旧 `/demo/` 链接自动跳转到新地址，保留查询参数和锚点。
- CV / Resume：按本人要求从导航、侧栏、页面、下载和公开 API 数据中移除。原本站 PDF 与预览仅保留在本地 `artifacts/documents/`，不会发布。
- Teaching / Personal：暂无本人确认的内容，不出现在导航；旧网址保留空状态。

桌面保留固定资料栏，手机首页显示紧凑资料区，其他手机页面聚焦正文。导航支持手机菜单、Escape 关闭、历史返回和研究段落锚点。页面使用 React + TypeScript + Vite；FastAPI 的 `/api/reference.json` 提供经过 Pydantic 验证的内容数据。前端使用根据内容生成的版本号读取 API，防止更新后继续显示旧的缓存标签。兼容入口 `/api/site.json` 返回同一份本人内容，旧的演示数据不再发布。

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

Vertebrae Study 由React组件渲染，通过FastAPI的 `/api/demo/vertebrae.{version}.json` 获取经过验证的数据；静态发布导出相同接口。网页保留采样切片的原生像素，用两个PNG分别无损编码CT的16位HU及前后标签，再在浏览器计算窗宽、透明度和改动叠加。每方向包含57–75张实际切片，覆盖主体、各椎骨及改动区域；界面标明原始切片位置和采样数量。3D曲面按毫米坐标导出，按需加载gzip包。完整网格统计和精炼预测下载与本地研究结果一致。

导出研究数据使用已经完成的10月6日项目，不重新推理，不复制模型权重、原上游代码、邮件或完整CT卷。生成的网页数据约148MiB，不进入源码分支；发布脚本会将构建后的数据写入 `gh-pages`。重建命令：

```bash
/home/data2/chk/workspace/2026/10/06/bodymaps_research_warmup/backend/.venv/bin/python scripts/export_vertebrae_demo.py --source /home/data2/chk/workspace/2026/10/06/bodymaps_research_warmup
npm --prefix frontend run build
.venv/bin/python scripts/export_static.py
```

本地像素来源核验：使用上述研究环境运行 `scripts/verify_demo_export.py --source ...`。浏览器核验脚本 `scripts/check_research_demo.cjs` 可接受本地静态入口或线上域名，检查两例、三方向、HU、标签、前后曲面、下载、手机操作和首页往返；结果与截图保存在 `artifacts/demo_*`。

本项目的发布脚本仅接受 `MVChem/mvchem.github.io` 仓库，保留 `gh-pages` 历史和现有域名配置。发布前先检查构建内容：

```bash
.venv/bin/python scripts/publish.py
```

## 内容和文件

- `frontend/src/App.tsx`：导航、路由、手机菜单、带版本号的内容读取。
- `frontend/src/components/ReferenceDocument.tsx`：正文、新闻滚动、首页扫描动画。
- `frontend/src/styles.css`：参考网站样式。
- `backend/content/public_profile.json`：唯一公开内容编辑源，含本人资料、经历及允许公开的论文。
- `scripts/build_personal_content.py`：从公开内容生成网页；可用 `--documents` 生成本地 PDF 和预览，不会写入发布目录。
- `backend/content/reference.json`：生成的语义页面数据；不要单独编辑。
- `backend/content/documents/`：本地 CV 和 Resume LaTeX 源文件，不作为网页内容发布。
- `frontend/public/`：本人照片、字体、图标和域名配置。
- `SOURCE_NOTICE.md`：参考内容和素材来源。

源代码位于 `feat/chenfang-homepage` 分支，静态构建发布到 `gh-pages`。原主页和参考作者版本保留在 Git 历史中。

## 主页访问统计（2026-10-09）

主页和 About 页底部接入 MapMyVisitors 的官方图片组件，显示真实访客地图和累计 pageviews；使用 eager 图片加载，打开主页就发起统计请求，不需要滚动到底部。统计入口为 [chuhongkang.com 的访客统计](https://mapmyvisitors.com/web/1c8re)。图片加载失败时保留入口并显示不可用状态。

组件在 `frontend/src/components/VisitorMap.tsx`，样式在同目录的 `visitor-map.css`。公开 widget key 属于 `https://chuhongkang.com/`，不能替换成其他人的代码。此方案由浏览器直接请求 MapMyVisitors，不依赖额外服务器；统计按该服务的 pageview 定义累计，从接入开始，初期数据包含接入检查。当前仅统计主页及 About 页，不代表所有子页面的总访问量，也不能用于确定访问者身份。所在地是基于 IP 的近似位置，VPN/代理可能影响结果。

账号按用户指示使用 UCAS 校邮箱。登录凭据只保存在本机 `~/.local/share/mapmyvisitors/account.json`，目录权限 `0700`，文件权限 `0600`；不进入 Git、构建或网页。可用该邮箱在官网重置密码。`.runtime/` 中的接入会话也是私有数据，已加入 Git 忽略。

## 检查

```bash
npm --prefix frontend run build
.venv/bin/python -m unittest backend.test_app -v
.venv/bin/python -m pip install -r backend/requirements-dev.txt
.venv/bin/python scripts/verify_replica.py http://127.0.0.1:5178
```

浏览器检查使用已安装的 `/usr/bin/google-chrome`，覆盖四个导航栏目和两个旧链接、360/390/768/960/1440 像素宽度、新闻滚动、手机菜单与历史返回，并确认 CV 栏目和下载已移除。截图和结果输出到 `artifacts/`。后端检查另核对公开数据、本人头像及移除的文档地址。
