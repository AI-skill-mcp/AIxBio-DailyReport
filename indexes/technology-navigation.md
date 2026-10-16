<!-- Generated from knowledge/technology-navigation.json. Do not edit by hand. -->
# 三级技术导航索引

版本：1.0 · 更新日期：2026-10-16

后续情报优先按本清单匹配主要研究对象与交付结果。

差异明显时先更新knowledge/technology-navigation.json，写清最具辨识特点与相邻类边界，再补充技术归属并重建索引。

详细流程见[分类流程](../docs/classification.md)。

## 领域与路线概览

- **生物数据科学**（Biological Data Science，biological-data）：解析已有测量数据：识别细胞状态，连接不同数据中的信息。
  - 细胞表征与解析（Cell Representation &amp; Analysis，cell-representation-analysis）：从观测数据学习表示，支持细胞注释与整合；不等同于预测干预后的反应。
- **分子设计与优化**（Molecular Design &amp; Optimization，molecular-design）：面向靶点与分子候选：决定研究谁、评价候选，再提出新设计。
  - 靶点证据整合与排序（Target Evidence &amp; Prioritization，target-evidence-prioritization）：整合疾病与遗传证据，确定优先验证的干预对象。
  - 结构预测与评测（Structure Prediction &amp; Evaluation，structure-prediction-evaluation）：研究给定分子的结构与结合方式；将预测方法和独立评测分别呈现。
  - 生成式分子设计（Generative Molecular Design，generative-molecular-design）：围绕设计约束提出新候选，交付可进一步验证的结构方案。
- **细胞与系统建模**（Cell &amp; Systems Modeling，cell-systems）：预测干预后的细胞响应或随时间变化的动态过程。
  - 暂无已收录路线；新增内容前先明确核心技术与分类边界。
- **科研流程与自动化**（Research Workflows &amp; Automation，research-automation）：组织研究任务与工具执行，交付可追溯的计算流程和研究材料。
  - 科研智能体工作流（Scientific Agent Workflows，scientific-agent-workflows）：连接证据检索、软件与计算工具；只有连接真实实验反馈后才属于实验闭环。

## 核心技术条目

### 单细胞表示学习

路径：生物数据科学 → 细胞表征与解析 → 单细胞表示学习

索引 ID：single-cell-representation

学习基因与细胞表示，支持多种单细胞分析任务。

- **研究对象**：已有单细胞分子测量与细胞状态
- **主要产出**：可用于注释、整合与下游分析的基因或细胞表示
- **最具辨识特点**：主要交付观测数据的表示与解析结果，而非指定干预后的响应预测。
- **分类边界**：若主要交付是加药或基因干预后的细胞读数，应先评估细胞与系统建模分支；模型附带的多任务能力不构成重复挂树理由。
- **已挂接技术**：
  - [scgpt](../knowledge/technologies/scgpt.json)：基础模型

### 多模态靶点发现

路径：分子设计与优化 → 靶点证据整合与排序 → 多模态靶点发现

索引 ID：multimodal-target-discovery

整合人群遗传、多组学与实验数据，支持靶点选择。

- **研究对象**：疾病相关基因、蛋白及其遗传和实验依据
- **主要产出**：待验证的疾病干预靶点与优先级
- **最具辨识特点**：主要交付干预对象或靶点假设，区别于生成分子候选或模拟完整细胞反应。
- **分类边界**：不因平台名含Virtual Human就归入细胞模拟；通用证据检索只有进一步给出靶点选择结果时才归入本类。
- **已挂接技术**：
  - [insitro-virtual-human](../knowledge/technologies/insitro-virtual-human.json)：发现平台

### 复合物结构预测

路径：分子设计与优化 → 结构预测与评测 → 复合物结构预测

索引 ID：complex-structure-prediction-methods

预测蛋白质与其他生物分子构成的复合物结构。

- **研究对象**：给定蛋白质、核酸、配体等组成的分子复合物
- **主要产出**：复合物三维结构预测及其置信信息
- **最具辨识特点**：交付结构预测本身；评测类交付对预测质量的独立评价，生成设计类提出新候选。
- **分类边界**：仅发布盲测规则、实验参照或评价结果的项目归入盲测类，不因测评对象是结构就标成预测模型。
- **已挂接技术**：
  - [alphafold-3](../knowledge/technologies/alphafold-3.json)：预测模型

### 蛋白质–配体盲测

路径：分子设计与优化 → 结构预测与评测 → 蛋白质–配体盲测

索引 ID：protein-ligand-blind-benchmarking

用隐藏实验结果评价结构预测，区分评测方法与被测模型。

- **研究对象**：模型提交的蛋白质–配体预测与隐藏的实验参照
- **主要产出**：可比较的盲测协议、指标与评价结果
- **最具辨识特点**：通过对参测者隐藏实验参照来检验泛化能力；本类评价模型，不产出预测模型。
- **分类边界**：普通回顾性测试、分子对接工具或结构预测模型不能仅凭有评分指标归入盲测；评测对象或参照公开方式明显不同，应先更新索引。
- **已挂接技术**：
  - [openbind-blind-evaluation](../knowledge/technologies/openbind-blind-evaluation.json)：盲测方法

### 蛋白骨架生成

路径：分子设计与优化 → 生成式分子设计 → 蛋白骨架生成

索引 ID：protein-backbone-generation

用生成模型提出蛋白质骨架，生成后仍需序列设计与实验验证。

- **研究对象**：满足功能或几何约束的新蛋白质骨架
- **主要产出**：新生成的蛋白质骨架候选
- **最具辨识特点**：设计对象是新的蛋白骨架，区别于预测给定序列的结构、生成小分子或优化已有序列。
- **分类边界**：小分子生成、抗体序列优化或酶性能优化不应仅因同用扩散模型而塞入本类；先补充分辨对象与产出的核心技术索引。
- **已挂接技术**：
  - [rfdiffusion](../knowledge/technologies/rfdiffusion.json)：生成模型

### 科研工作流编排

路径：科研流程与自动化 → 科研智能体工作流 → 科研工作流编排

索引 ID：scientific-workflow-orchestration-tools

组织检索、计算与研究材料产出，保留工具调用和证据链。

- **研究对象**：科研数字任务、证据与软件工具的执行步骤
- **主要产出**：可追溯的计算研究流程与研究材料
- **最具辨识特点**：主要组织数字研究任务的执行，区别于直接预测生物对象，也未必连接真实湿实验。
- **分类边界**：只有论文问答的工具、主动选择下一轮实验的系统或机器人湿实验执行，应先按其主要交付结果评估独立路线，不因都称Agent而合并。
- **已挂接技术**：
  - [antigravity-science-workflows](../knowledge/technologies/antigravity-science-workflows.json)：协作流程
