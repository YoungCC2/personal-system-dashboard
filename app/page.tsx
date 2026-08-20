"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import content from "../data/content.json";

type DocumentItem = {
  id: string;
  type: "education" | "growth" | "decision";
  title: string;
  date: string;
  period: string;
  excerpt: string;
  body: string;
  path: string;
  actionCard: boolean;
};

type Tab = "overview" | "education" | "growth" | "decisions";

type DashboardContent = {
  generatedAt: string;
  generatedAtIso: string;
  latestReportDate: string;
  latestDailyDate: string;
  freshness: { status: "current" | "recent" | "stale"; label: string };
  calendar: { isoWeek: number; monthLabel: string; yearLabel: string };
  metrics: { educationWeekly: number; growthWeekly: number; actionCards: number; practiceRecords: number };
  documents: DocumentItem[];
};

const tabs: { id: Tab; label: string; note: string }[] = [
  { id: "overview", label: "总览", note: "本周状态" },
  { id: "education", label: "教育雷达", note: "行业与机会" },
  { id: "growth", label: "个人成长", note: "实践与工具" },
  { id: "decisions", label: "行动决策", note: "选择与闭环" },
];

function Markdown({ body }: { body: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "历史记录";
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

export default function Home() {
  const dashboard = content as DashboardContent;
  const documents = dashboard.documents;
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const [readerOpen, setReaderOpen] = useState(false);

  const filtered = useMemo(() => {
    if (tab === "education") return documents.filter((item) => item.type === "education");
    if (tab === "growth") return documents.filter((item) => item.type === "growth");
    if (tab === "decisions") return documents.filter((item) => item.type === "decision");
    return documents.filter((item) => item.type !== "decision").slice(0, 6);
  }, [documents, tab]);

  const selected = documents.find((item) => item.id === selectedId) ?? filtered[0] ?? documents[0];
  const latestEducation = documents.find((item) => item.type === "education");
  const latestGrowth = documents.find((item) => item.type === "growth");

  function openDocument(item: DocumentItem) {
    setSelectedId(item.id);
    setReaderOpen(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div><strong>个人系统</strong><span>Personal OS</span></div>
        </div>

        <nav aria-label="主导航">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => { setTab(item.id); setReaderOpen(false); }}>
              <span className="nav-dot" />
              <span><strong>{item.label}</strong><small>{item.note}</small></span>
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <div className={`pulse ${dashboard.freshness.status}`} />
          <div><strong>Codex 接管运行</strong><span>{dashboard.freshness.label} · {dashboard.generatedAt}</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">D先生 · 个人成长与决策系统</p>
            <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="date-chip"><span>第 {dashboard.calendar.isoWeek} 周</span><strong>{dashboard.calendar.yearLabel}{dashboard.calendar.monthLabel}</strong></div>
        </header>

        <section className={`freshness-bar ${dashboard.freshness.status}`} aria-label="数据新鲜度">
          <div><i /><strong>{dashboard.freshness.label}</strong><span>最新日报 {formatDate(dashboard.latestDailyDate)}</span></div>
          <div><span>最新周报 {formatDate(dashboard.latestReportDate)}</span><span>同步时间 {dashboard.generatedAt}</span></div>
        </section>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="status-pill"><i /> 系统验证中</span>
            <h2>少采集，<em>多行动。</em></h2>
            <p>把外部信号转化为真实判断，把每次实践沉淀为下一步。现在的重点不是扩展模块，而是恢复稳定采集与行动闭环。</p>
          </div>
          <div className="hero-meter" aria-label="阶段进度 48%">
            <div className="meter-ring"><strong>48</strong><span>%</span></div>
            <p>阶段 1–2</p><small>稳定性复验</small>
          </div>
        </section>

        <section className="metrics" aria-label="系统指标">
          <article><span className="metric-icon amber">教</span><div><small>教育周报</small><strong>{dashboard.metrics.educationWeekly}</strong><em>期历史产出</em></div></article>
          <article><span className="metric-icon blue">长</span><div><small>成长周报</small><strong>{dashboard.metrics.growthWeekly}</strong><em>期历史产出</em></div></article>
          <article><span className="metric-icon green">行</span><div><small>行动卡</small><strong>{dashboard.metrics.actionCards}</strong><em>张历史记录</em></div></article>
          <article><span className="metric-icon violet">践</span><div><small>实践记录</small><strong>{dashboard.metrics.practiceRecords}</strong><em>条真实输入</em></div></article>
        </section>

        {tab === "overview" && (
          <section className="focus-grid">
            <button type="button" className="focus-card education" onClick={() => latestEducation && openDocument(latestEducation)}>
              <div className="card-top"><span>EDUCATION RADAR</span><b>教育行业</b></div>
              <h3>{latestEducation?.title ?? "暂无教育周报"}</h3>
              <p>{latestEducation?.excerpt}</p>
              <footer><span>{latestEducation?.period}</span><b className="card-link">阅读周报 →</b></footer>
            </button>
            <button type="button" className="focus-card growth" onClick={() => latestGrowth && openDocument(latestGrowth)}>
              <div className="card-top"><span>GROWTH REVIEW</span><b>个人成长</b></div>
              <h3>{latestGrowth?.title ?? "暂无成长周报"}</h3>
              <p>{latestGrowth?.excerpt}</p>
              <footer><span>{latestGrowth?.period}</span><b className="card-link">阅读周报 →</b></footer>
            </button>
          </section>
        )}

        <section className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">DOCUMENT STREAM</p><h2>{tab === "overview" ? "最近产出" : "全部记录"}</h2></div>
            <span>{filtered.length} 份文档</span>
          </div>
          <div className="document-list">
            {filtered.map((item) => (
              <button key={item.id} className="document-row" onClick={() => openDocument(item)}>
                <span className={`doc-type ${item.type}`}>{item.type === "education" ? "教" : item.type === "growth" ? "长" : "策"}</span>
                <span className="doc-main"><strong>{item.title}</strong><small>{item.excerpt}</small></span>
                <span className="doc-meta"><time>{formatDate(item.date)}</time>{item.actionCard && <b>含行动卡</b>}</span>
                <span className="arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="page-footer"><span>本地 Markdown 是唯一真相源</span><span>Codex · 2026</span></footer>
      </section>

      <aside className={`reader ${readerOpen ? "open" : ""}`} aria-hidden={!readerOpen}>
        <div className="reader-head">
          <div><span>{selected?.type === "education" ? "教育周报" : selected?.type === "growth" ? "成长周报" : "决策日志"}</span><small>{selected?.path}</small></div>
          <button aria-label="关闭文档" onClick={() => setReaderOpen(false)}>×</button>
        </div>
        <div className="reader-body">{selected && <Markdown body={selected.body} />}</div>
      </aside>
      {readerOpen && <button className="scrim" aria-label="关闭文档" onClick={() => setReaderOpen(false)} />}
    </main>
  );
}
