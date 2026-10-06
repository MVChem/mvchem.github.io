# 版式和个人内容来源

页面版式沿用用户此前选定的 [Chen Fang 主页](https://www.chenfangcs.com/) 参考版本，使用本项目的 React 组件和 FastAPI 内容接口。

2026-10-06 已替换为储红康（Hongkang Chu）的个人资料。头像采用本人提供的 `frontend/public/photos/chuhongkang-centered.png`；参考作者的照片、经历、研究、论文、个人生活、CV、Resume 和附件不再发布。无已核实资料的 Teaching 和 Personal 栏目不出现在导航中，旧链接保留简短空状态。

公开内容的唯一编辑源为 `backend/content/public_profile.json`。网页数据、公开 CV、Resume 和预览由 `scripts/build_personal_content.py` 生成，不从申请用 CV 或未公开论文稿件复制内容。

姓名、教育和经历取自用户确认的申请材料；浙江大学的研究写为合作经历，UIUC 写为远程研究实习。文章方法概述不推导个人独立完成全部工作的结论。

论文核对来源：

- TRACE：[arXiv](https://arxiv.org/abs/2609.25775) 和 [OpenReview](https://openreview.net/forum?id=erYE1VciKv)。2026-10-01 已认证的本地 OpenReview 记录确认作者顺序与 ICLR 2027 投稿状态；2026-10-06 公开 API 返回 403，不能据此报告新增录用决定，页面保留 Under Review。
- ClueAegis：[arXiv](https://arxiv.org/abs/2605.25009) 和 [OpenReview](https://openreview.net/forum?id=Hxm5eSFUT9)。本地认证记录确认 Findings of EMNLP 2026 录用。
- MRL：[出版页面](https://www.sciencedirect.com/science/article/pii/S2772516226000161)、[PubMed](https://pubmed.ncbi.nlm.nih.gov/42433312/) 和 Crossref DOI 元数据。用户为第四作者；在线发表日期为 2026-04-06，卷期标作 2026 年 11 月，页面写 Published Online。
- JPCL：[PubMed](https://pubmed.ncbi.nlm.nih.gov/41508827/) 和 [DOI](https://doi.org/10.1021/acs.jpclett.5c03529)。赵传文为第一作者，储红康为第七作者。
- ISMRM：[2026 官方 Power Pitch Oral 日程](https://echo.ismrm.org/program/ISMRM2026/at-a-glance/session/616)。储红康为第一作者；页面表述入选报告形式，不推定本人到场。
- IJMS：[PubMed](https://pubmed.ncbi.nlm.nih.gov/38674091/) 和 [全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11049818/)。储红康为第一作者。

Source Serif 4 字体采用 SIL Open Font License，许可证保留在 `frontend/public/licenses/Source-Serif-4-OFL.txt`。参考样式及其他保留素材的权利归其权利人；本项目未授予额外许可证。
