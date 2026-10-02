# MVChem 的个人主页

按照 [huxx.me/zh](https://huxx.me/zh/) 的页面结构、尺寸、配色和交互重建，使用 MVChem 身份。经历、项目、兴趣和技能为可替换示例，没有将参考作者的个人履历作为 MVChem 的履历。

- `frontend/`：React + TypeScript + Vite，中文、英文、日文和韩文界面。
- `backend/`：FastAPI 和 Pydantic，`/api/site.json` 提供完整四语言数据。
- `backend/data.py`：编辑个人介绍、探索方向、项目与技能。
- `scripts/export_static.py`：从真实 API 导出静态数据和语言入口。
- `scripts/publish.py`：将 `frontend/dist/` 发布到本仓库的 `gh-pages` 分支。

首页包含可调整高度的 Pong、个人介绍、可展开经历、技能区和打砖块；游戏关卡会增加每秒经验并切换首页颜色。经验、游戏关卡和主题保存在浏览器中，后台标签页不增长经验。作品集有分类锚点、搜索和独立项目页；关于页支持旅程切换、卡片大小调整和多标签筛选。导航支持四语言切换、手机全屏菜单和返回作品集时恢复滚动位置。

参考头像、装饰人物和技能品牌图标的来源说明见 [`frontend/public/reference/NOTICE.txt`](frontend/public/reference/NOTICE.txt)。字体和 Font Awesome 许可证见 [`frontend/public/licenses/`](frontend/public/licenses/)。项目封面和照片框内的占位插图由代码绘制，使用示例内容。

## 本地运行

首次安装 Python 依赖，在仓库根目录执行：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

启动后端：

```bash
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8026
```

在另一个终端启动前端，使用 Vite 输出的本地地址访问：

```bash
cd frontend
npm ci --include=dev
npm run dev
```

前端开发服务会将 `/api` 请求代理到 FastAPI。完成构建后，也可直接通过 FastAPI 的 `http://127.0.0.1:8026/zh/` 访问页面，语言前缀也支持 `en`、`ja` 和 `ko`。

## 构建与发布

在仓库根目录构建并导出数据：

```bash
npm --prefix frontend run build
.venv/bin/python scripts/export_static.py
```

GitHub Pages 只能托管静态文件，不能运行 Python。线上页面读取 `frontend/dist/api/site.json` 快照；每次修改 `backend/data.py` 后需要重新导出和发布。导出同时生成四语言首页、`portfolio/`、`aboutme/` 和 `projects/<项目ID>/` 的直接访问入口，以及 `404.html` 和 `.nojekyll`。

先提交源码，再执行发布命令：

```bash
.venv/bin/python scripts/publish.py
```

发布脚本要求当前仓库已配置 `git user.name`、`git user.email`，并可通过 Git 访问 GitHub。它只接受 `MVChem/mvchem.github.io` 作为 `origin`，保留 `gh-pages` 历史，只上传 `frontend/dist/`；无内容变化时不创建提交。脚本不会修改 GitHub Pages 设置，Pages 应使用 `gh-pages` 分支的根目录。

## 检查

```bash
.venv/bin/python -m unittest backend.test_app -v
npm --prefix frontend run typecheck
```

浏览器检查需要安装 `playwright`，并有 Google Chrome（默认 `/usr/bin/google-chrome`，可通过 `CHROME_PATH` 指定）。启动开发服务后运行：

```bash
.venv/bin/python scripts/check_browser.py http://127.0.0.1:5173
```

检查覆盖桌面与手机布局、四语言导航、小游戏启动/暂停、球场高度调整和经验进度保存。截图输出到被 Git 忽略的 `artifacts/`。
