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

  // 新增：Pro 会员状态与激活弹窗所需的状态
  const [isPro, setIsPro] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  // 新增：每次打开网页时，检查浏览器缓存里是否已经激活过
  useEffect(() => {
    const savedPro = localStorage.getItem("json2mermaid_is_pro");
    if (savedPro === "true") {
      setIsPro(true);
    }
  }, []);

  // 新增：点击 Activate 按钮时，把激活码发给 Lemon Squeezy 官方验证
  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setActivateError("Please enter your license key.");
      return;
    }

    setActivating(true);
    setActivateError("");

    try {
      const response = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          license_key: licenseKey.trim(),
          instance_name: "JSON2Mermaid_Web_User",
        }),
      });

      const data = await response.json();

      if (data.activated) {
        setIsPro(true);
        localStorage.setItem("json2mermaid_is_pro", "true");
        localStorage.setItem("json2mermaid_license_key", licenseKey.trim());
        setShowProModal(false);
        alert("🎉 Pro version unlocked successfully!");
      } else {
        setActivateError(data.error || "Invalid license key or activation limit reached.");
      }
    } catch (err) {
      setActivateError("Network error. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  // 原有的实时渲染逻辑（保持不变）
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
        {/* 👉 替换原有的 <a> 标签 */}
        {isPro ? (
          <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold px-3.5 py-1.5 rounded-lg text-sm">
            👑 Pro Unlocked
          </span>
        ) : (
          <button
            onClick={() => setShowProModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro ($4.99)
          </button>
        )}
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
              onClick={() => {
                if (!isPro) {
                  setShowProModal(true);
                  return;
                }
                const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'json2mermaid-diagram.svg';
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors cursor-pointer"
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
      
      {/* 👉 替换原有的弹窗代码 */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                JSON2Mermaid Pro
              </h3>
              <button
                onClick={() => setShowProModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Unlock unlimited diagram exports (SVG/PNG), watermark-free charts, and large JSON parsing with a one-time payment.
            </p>

            {/* 购买链接：这里保持你正确的 Lemon Squeezy Checkout URL */}
            <a
              href="https://lyjaneyu1-tools.lemonsqueezy.com/checkout/buy/07b30a72-7333-4f47-943c-3158a3cbe438"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all mb-6 shadow-md"
            >
              Buy License Key — $4.99 (One-time)
            </a>

            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Already purchased? Enter your License Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  onClick={handleActivateLicense}
                  disabled={activating}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {activating ? "Verifying..." : "Activate"}
                </button>
              </div>
              {activateError && (
                <p className="text-xs text-red-400 mt-2">{activateError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}