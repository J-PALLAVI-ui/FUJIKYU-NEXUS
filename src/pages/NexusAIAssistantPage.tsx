import React, { useState } from 'react';
import {
  MessageSquareCode,
  Send,
  Database,
  Calendar,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Code,
  BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { NaturalLanguageResponse } from '../types';

const SUGGESTED_QUERIES = [
  "What were our total sales this month?",
  "Which products generated the highest revenue?",
  "How did passenger numbers change this quarter?",
  "What unusual patterns were detected?",
  "What are the predicted hotel occupancy levels?",
  "Compare park visitor numbers with railway passenger demand."
];

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  data?: NaturalLanguageResponse;
  timestamp: string;
}

export const NexusAIAssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello, I am NEXUS AI, the autonomous data intelligence assistant for the Fujikyu Group. You can ask me natural language questions about passenger demand, retail turnover, hotel occupancy, coaster visitor trends, or operational anomalies across all 8 business divisions.",
      timestamp: '09:00 AM'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryAssistant(textToSend);
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.answer,
        data: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered an error querying the verified database. Please verify your query syntax.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span>NEXUS AI Enterprise Data Assistant</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Controlled Text-to-SQL
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Read-only verified database execution with zero hallucination and strict permission checking
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security Guardrails Active</span>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                AI
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white shadow-xs rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs space-y-3'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="font-bold opacity-75">{m.sender === 'user' ? 'You' : 'NEXUS AI'}</span>
                <span className="text-[10px] opacity-60">{m.timestamp}</span>
              </div>

              <p className="text-sm font-medium">{m.text}</p>

              {/* Supporting Data Visualization & Attribution */}
              {m.data && (
                <div className="space-y-3 pt-2 border-t border-slate-200/80">
                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      <Database className="w-3 h-3 text-blue-600" />
                      <span>Source: {m.data.data_source}</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{m.data.date_range}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold border border-emerald-200">
                      {(m.data.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>

                  {/* Render Supporting Chart if present */}
                  {m.data.chart_type && m.data.chart_data.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center">
                        <BarChart2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Supporting Visual Evidence
                      </p>

                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {m.data.chart_type === 'bar' ? (
                            <BarChart data={m.data.chart_data}>
                              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey={m.data.columns[0]} tick={{ fontSize: 9 }} stroke="#94A3B8" />
                              <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" />
                              <Tooltip contentStyle={{ fontSize: '10px' }} />
                              <Bar dataKey={m.data.columns[1]} fill="#0066CC" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          ) : m.data.chart_type === 'line' ? (
                            <LineChart data={m.data.chart_data}>
                              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                              <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" />
                              <Tooltip contentStyle={{ fontSize: '10px' }} />
                              <Line type="monotone" dataKey={m.data.columns[1]} stroke="#0066CC" strokeWidth={2} dot={{ r: 2 }} />
                              {m.data.columns[2] && (
                                <Line type="monotone" dataKey={m.data.columns[2]} stroke="#E63946" strokeWidth={2} dot={{ r: 2 }} />
                              )}
                            </LineChart>
                          ) : (
                            <div className="overflow-x-auto max-h-40">
                              <table className="w-full text-left text-[10px]">
                                <thead className="bg-slate-100 text-slate-600">
                                  <tr>
                                    {m.data.columns.map((c) => (
                                      <th key={c} className="py-1 px-2 uppercase">{c}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.data.chart_data.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-100">
                                      {m.data?.columns.map((c) => (
                                        <td key={c} className="py-1 px-2">{row[c]}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Render Verified SQL Snippet */}
                  {m.data.sql_executed && (
                    <details className="text-[10px] text-slate-500 cursor-pointer">
                      <summary className="font-semibold text-slate-600 hover:text-blue-600 flex items-center space-x-1">
                        <Code className="w-3 h-3" /> <span>Inspect Verified SQL Query</span>
                      </summary>
                      <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg mt-1 overflow-x-auto font-mono text-[9px]">
                        {m.data.sql_executed}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
            <Bot className="w-4 h-4 animate-bounce text-blue-600" />
            <span>Formulating read-only SQL query and synthesizing verified results...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Suggested:</span>
        {SUGGESTED_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 text-xs whitespace-nowrap transition shadow-2xs font-medium"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(query);
        }}
        className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-md flex-shrink-0"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask NEXUS AI a question (e.g. Which business division had the largest performance improvement?)"
          className="flex-1 px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
