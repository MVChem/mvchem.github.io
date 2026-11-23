# 版式和个人内容来源

页面版式沿用用户此前选定的 [Chen Fang 主页](https://www.chenfangcs.com/) 参考版本，使用本项目的 React 组件和 FastAPI 内容接口。

2026-10-06 已替换为储红康（Hongkang Chu）的个人资料。头像采用本人提供的 `frontend/public/photos/chuhongkang-centered.png`；参考作者的照片、经历、研究、论文、个人生活、CV、Resume 和附件不再发布。无已核实资料的 Teaching 和 Personal 栏目不出现在导航中，旧链接保留简短空状态。

公开内容的唯一编辑源为 `backend/content/public_profile.json`。网页数据由 `scripts/build_personal_content.py` 生成，不从申请用 CV 或未公开论文稿件复制内容。按本人最新要求，本站 CV 栏目、侧栏链接、PDF 下载和预览已移除；本地文档保存在 `artifacts/documents/`，不会发布。

姓名、教育和经历取自用户确认的申请材料；浙江大学的研究写为合作经历，UIUC 写为远程研究实习。文章方法概述不推导个人独立完成全部工作的结论。

论文核对来源：

- MRM 投稿：作者提供的 Acquisition-matched deep learning reconstruction for weighted-average deuterium metabolic imaging。网页预览使用稿件的 Figure 2，GitHub 保存从作者稿转换的 PDF。
- TRACE：[arXiv](https://arxiv.org/abs/2609.25775) 和 [OpenReview](https://openreview.net/forum?id=erYE1VciKv)。2026-10-01 已认证的本地 OpenReview 记录确认作者顺序与 ICLR 2027 投稿状态；2026-10-06 公开 API 返回 403，不能据此报告新增录用决定，页面保留 Under Review。
- ClueAegis：[arXiv](https://arxiv.org/abs/2605.25009) 和 [OpenReview](https://openreview.net/forum?id=Hxm5eSFUT9)。本地认证记录确认 Findings of EMNLP 2026 录用。
- MRL：[出版页面](https://www.sciencedirect.com/science/article/pii/S2772516226000161)、[PubMed](https://pubmed.ncbi.nlm.nih.gov/42433312/) 和 Crossref DOI 元数据。用户为第四作者；在线发表日期为 2026-04-06，卷期标作 2026 年 11 月，页面写 Published Online。
- JPCL：[PubMed](https://pubmed.ncbi.nlm.nih.gov/41508827/) 和 [DOI](https://doi.org/10.1021/acs.jpclett.5c03529)。赵传文为第一作者，储红康为第七作者。
- ISMRM：[2026 官方 Power Pitch Oral 日程](https://echo.ismrm.org/program/ISMRM2026/at-a-glance/session/616)。储红康为第一作者；页面表述入选报告形式，不推定本人到场。
- IJMS：[PubMed](https://pubmed.ncbi.nlm.nih.gov/38674091/) 和 [全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11049818/)。储红康为第一作者。

论文预览图（`frontend/public/papers/`）取自各论文的公开版本，仅缩放、补白或裁切：MedCaseAgent 和 ClueAegis 来自 arXiv 源文件中的作者原图；TRACE 使用 arXiv 上完整的 [Figure 2](https://arxiv.org/html/2609.25775v1#S3.F2)，以无损 WebP 展示（CC BY 4.0）；Magnetic Resonance Letters 论文使用 PMC13352062 的 graphical abstract（CC BY-NC-ND 4.0，未裁切）；IJMS 论文使用 PMC11049818 的 [Figure 5 分类 UMAP](https://pmc.ncbi.nlm.nih.gov/articles/PMC11049818/#ijms-25-04507-f005)（CC BY 4.0）；ISMRM 2026 使用官方摘要页提供的 preview 图。JPCL 预览为 Chuanwen Zhao 等人 [ACS Supporting Information Figure S3](https://doi.org/10.1021/acs.jpclett.5c03529.s001)，从补充材料第 4 页裁取完整六个子图并渲染为 WebP，采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 授权。来源和裁切参数记录在 `scripts/build_paper_previews.py`。

项目预览图使用作者提供的 MedWorld-JEPA Figure 2 和 VideoAudience Figure 1 原图。VideoAudience 的视频画面来自 [哔哩哔哩](https://www.bilibili.com/video/BV1ahgp62E7u/)，表情图标来自 [Twemoji v14.0.2](https://github.com/twitter/twemoji/blob/v14.0.2/assets/svg/1f602.svg)，版权归 Twitter, Inc. 及其他贡献者所有，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授权，图标仅缩放。

Source Serif 4 字体采用 SIL Open Font License，许可证保留在 `frontend/public/licenses/Source-Serif-4-OFL.txt`。参考样式及其他保留素材的权利归其权利人；本项目未授予额外许可证。
