'use client';

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Code2, Eye, Download, Sparkles, CheckCircle2 } from 'lucide-react';

// 初始化 Mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

// 默认示例 JSON
const DEFAULT_JSON = `{
  "name": "User Order Flow",
  "steps": [
    { "id": "1", "action": "Submit Order", "next": "2" },
    { "id": "2", "action": "Payment Check", "next": ["3", "4"] },
    { "id": "3", "condition": "Success", "action": "Ship Item" },
    { "id": "4", "condition": "Failed", "action": "Cancel Order" }
  ]
}`;

// 将 JSON 转换为 Mermaid DSL 语法
function jsonToMermaid(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    let code = 'graph TD;\n';

    if (data.steps && Array.isArray(data.steps)) {
      data.steps.forEach((step: any) => {
        const fromNode = `Node_${step.id}["${step.action}"]`;
        if (Array.isArray(step.next)) {
          step.next.forEach((nextId: string) => {
            code += `  ${fromNode} --> Node_${nextId};\n`;
          });
        } else if (step.next) {
          code += `  ${fromNode} --> Node_${step.next};\n`;
        }
        if (step.condition) {
          code += `  ${fromNode} -- "${step.condition}" --> End;\n`;
        }
      });
    } else {
      // 泛化对象解析
      Object.keys(data).forEach((key, index) => {
        const val = typeof data[key] === 'object' ? JSON.stringify(data[key]).slice(0, 15) : data[key];
        code += `  Root["${data.name || 'JSON'}"] --> K_${index}["${key}: ${val}"];\n`;
      });
    }
    return code;
  } catch (e) {
    return 'graph TD;\n  Error["Invalid JSON Input Format"];';
  }
}

export default function Home() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON);
  const [svgOutput, setSvgOutput] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const renderCount = useRef(0);

  // 实时渲染逻辑
  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const mermaidCode = jsonToMermaid(jsonInput);
        renderCount.current += 1;
        const { svg } = await mermaid.render(`mermaid-svg-${renderCount.current}`, mermaidCode);
        setSvgOutput(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };

    const timer = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timer);
  }, [jsonInput]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 顶部 Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            JSON2Mermaid
          </h1>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
            Free Online Tool
          </span>
        </div>
        <button
          onClick={() => setShowProModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Pro ($4.99)
        </button>
      </header>

      {/* 主工作区 */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-[1800px] w-full mx-auto">
        {/* 左侧：JSON 输入区 */}
        <div className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3 text-slate-400 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Code2 className="w-4 h-4 text-indigo-400" /> Input JSON Data
            </span>
            <button
              onClick={() => setJsonInput(DEFAULT_JSON)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Reset Example
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-cyan-300 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            placeholder="Paste your JSON here..."
          />
        </div>

        {/* 右侧：流程图预览区 */}
        <div className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3 text-slate-400 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Eye className="w-4 h-4 text-cyan-400" /> Live Visual Diagram
            </span>
            <button
              onClick={() => setShowProModal(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export SVG/PNG
            </button>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-center overflow-auto min-h-[400px]">
            {svgOutput ? (
              <div
                dangerouslySetInnerHTML={{ __html: svgOutput }}
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
              />
            ) : (
              <p className="text-slate-600 text-sm">Parsing JSON structure...</p>
            )}
          </div>
        </div>
      </main>

      {/* 预留付费弹窗（用于接入 Lemon Squeezy） */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Unlock Pro Features</h3>
            <p className="text-slate-400 text-sm mb-6">
              Get high-resolution SVG exports, unlimited AI structure optimization, and custom node styling.
            </p>
            <ul className="space-y-3 mb-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited HD SVG & PNG Export
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> AI Auto-Layout Improvement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Commercial Use License
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Here we will connect your Lemon Squeezy checkout URL!');
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
              >
                Get Lifetime Access ($4.99)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}