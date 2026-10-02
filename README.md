# MVChem 的个人主页

参考 [huxx.me/zh](https://huxx.me/zh/) 的布局与视觉，使用 MVChem 身份和原创几何图形。经历、项目及技能目前是明确标注的可替换示例。

- `frontend/`：React + TypeScript + Vite，中英双语界面。
- `backend/`：FastAPI 和 Pydantic，`/api/site.json` 提供完整双语数据。
- `backend/data.py`：编辑个人介绍、探索方向、项目与技能。
- `scripts/export_static.py`：从真实 API 导出静态数据和语言入口。
- `scripts/publish.py`：将 `frontend/dist/` 发布到本仓库的 `gh-pages` 分支。

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

前端开发服务会将 `/api` 请求代理到 FastAPI。完成构建后，也可直接通过 FastAPI 的 `http://127.0.0.1:8026/zh/` 或 `/en/` 访问页面。

## 构建与发布

在仓库根目录构建并导出数据：

```bash
npm --prefix frontend run build
.venv/bin/python scripts/export_static.py
```

GitHub Pages 只能托管静态文件，不能运行 Python。线上页面读取 `frontend/dist/api/site.json` 快照；每次修改 `backend/data.py` 后需要重新导出和发布。导出同时生成 `/zh/`、`/en/`、`404.html` 和 `.nojekyll`。

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
