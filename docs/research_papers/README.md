# 📚 Research Papers for MIRA (Autonomous Competitor Intelligence Engine)

This directory contains the **full-text research papers (PDFs)** and references underpinning MIRA's core architectural and machine learning components.

---

## 📑 Included Research Papers

| # | Paper Title | Venue / Year | File Path | Online Link |
|---|---|:---:|---|---|
| **1** | **War and Peace (WarAgent): Large Language Model-based Multi-Agent Simulation of World Wars** | **ACL 2024** | [`1_WarAgent_ACL2024.pdf`](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/1_WarAgent_ACL2024.pdf) | [PDF Link](https://arxiv.org/pdf/2311.17227.pdf) |
| **2** | **EconAgent: Large Language Model-Empowered Agents for Simulating Macroeconomic Activities** | **ACL 2024** | [`2_EconAgent_ACL2024.pdf`](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/2_EconAgent_ACL2024.pdf) | [PDF Link](https://arxiv.org/pdf/2310.07864.pdf) |
| **3** | **Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection** | **ICLR 2024** | [`3_Self_RAG_ICLR2024.pdf`](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/3_Self_RAG_ICLR2024.pdf) | [PDF Link](https://arxiv.org/pdf/2310.11511.pdf) |
| **4** | **Mind2Web: Towards a Generalist Agent for the Web** | **NeurIPS 2023** | [`4_Mind2Web_NeurIPS2023.pdf`](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/4_Mind2Web_NeurIPS2023.pdf) | [PDF Link](https://arxiv.org/pdf/2306.06070.pdf) |
| **5** | **Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5 / BGE Frameworks)** | **ACL 2024** | [`5_E5_Embeddings_ACL2024.pdf`](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/5_E5_Embeddings_ACL2024.pdf) | [PDF Link](https://arxiv.org/pdf/2212.03533.pdf) |

---

## 🔬 Deep-Dive & System Mapping

### 1. WarAgent: Multi-Agent Game-Theoretic Conflict & Strategy Simulation
- **Authors:** Wenyue Hua, Lizhou Fan, Lingyao Li, Kai Mei, Jianchao Ji, Yingqiang Ge, Libby Hemphill, Yongfeng Zhang
- **Venue:** Association for Computational Linguistics (**ACL 2024**)
- **Local Copy:** [1_WarAgent_ACL2024.pdf](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/1_WarAgent_ACL2024.pdf)
- **MIRA Component:** **Competitive War Room Simulator** (`"What-If"` Scenario Engine)
- **Why It Matters:** Demonstrates how autonomous LLM agents make decisions, assess risks, calculate retaliatory actions, and simulate multi-step counter-offensives when dynamic competitive moves are made.

---

### 2. EconAgent: LLM Agents Simulating Market Competition & Price Shocks
- **Authors:** Nian Li, Chen Gao, Mingyu Li, Yong Li, Qingmin Liao (*Tsinghua University*)
- **Venue:** Association for Computational Linguistics (**ACL 2024**)
- **Local Copy:** [2_EconAgent_ACL2024.pdf](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/2_EconAgent_ACL2024.pdf)
- **MIRA Component:** **Dynamic Market Intelligence & ROI Defense Engine**
- **Why It Matters:** Models how agents respond to pricing adjustments, product changes, and economic shifts, enabling MIRA to predict competitor price elasticity and customer displacement.

---

### 3. Self-RAG: Grounded, Self-Reflective Intelligence & Battlecard Generation
- **Authors:** Akari Asai, Zeqiu Wu, Yizhong Wang, Avirup Sil, Hannaneh Hajishirzi
- **Venue:** International Conference on Learning Representations (**ICLR 2024, Oral**)
- **Local Copy:** [3_Self_RAG_ICLR2024.pdf](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/3_Self_RAG_ICLR2024.pdf)
- **MIRA Component:** **MIRA Oracle (AI Strategy Co-Pilot)** & **Auto-Battlecard Generator**
- **Why It Matters:** Outlines the self-reflection and selective retrieval framework that eliminates hallucinations in automated sales battlecards and objection-handling scripts.

---

### 4. Mind2Web: Autonomous Web Agents & Complex DOM Scraping
- **Authors:** Xiang Deng, Yu Gu, Boyuan Zheng, Shijie Chen, Samuel Stevens, Boshi Wang, Huan Sun, Yu Su (*Ohio State University*)
- **Venue:** Conference on Neural Information Processing Systems (**NeurIPS 2023, Spotlight**)
- **Local Copy:** [4_Mind2Web_NeurIPS2023.pdf](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/4_Mind2Web_NeurIPS2023.pdf)
- **MIRA Component:** **Double-Engine Scraper** (`axios` + `puppeteer`) & **Chrome Extension**
- **Why It Matters:** Provides the blueprint for filtering complex DOM noise (navbars, footers, cookie banners) to extract clean, high-value competitor product and pricing signals.

---

### 5. E5 / BGE Embeddings: Dense Vector Representations for Semantic Change Detection
- **Authors:** Liang Wang, Nan Yang, Xiaolong Huang, Binxing Jiao, Linjun Yang, Daxin Jiang, Rangan Majumder, Furu Wei (*Microsoft Research*)
- **Venue:** Association for Computational Linguistics (**ACL 2024**)
- **Local Copy:** [5_E5_Embeddings_ACL2024.pdf](file:///Users/nitheshkumar/Documents/MIRA/docs/research_papers/5_E5_Embeddings_ACL2024.pdf)
- **MIRA Component:** **ONNX Semantic Change Detection Pipeline**
- **Why It Matters:** Establishes the methodology for high-performance contrastive text embeddings that detect substantive semantic differences while ignoring trivial cosmetic rewrites.
