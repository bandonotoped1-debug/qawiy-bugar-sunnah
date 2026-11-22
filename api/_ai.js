// Penyedia AI bersama untuk /api/menu dan /api/chat.
// (File berawalan "_" tidak dijadikan endpoint oleh Vercel.)
// Urutan prioritas: GEMINI_API_KEY → ANTHROPIC_API_KEY → OPENROUTER_API_KEY
//   GEMINI_MODEL  opsional, default "gemini-flash-latest" (alias Flash terbaru)

const enabled = () => !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY);

// messages: [{role:"user"|"assistant", content}]
async function callAI(system, messages, opts) {
  opts = opts || {};
  const max = opts.maxTokens || 1500;

  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: Object.assign({ maxOutputTokens: Math.max(max, 2048), temperature: 0.6 }, opts.json ? { responseMimeType: "application/json" } : {})
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "Gemini error " + r.status);
    const c = (j.candidates || [])[0];
    const text = c && c.content && (c.content.parts || []).map((p) => (p.thought ? "" : p.text || "")).join("");
    if (!text) throw new Error("Gemini tidak memberi jawaban" + (c && c.finishReason ? " (" + c.finishReason + ")" : ""));
    return text;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "claude-haiku-5-5", max_tokens: max, system, messages })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
    return (j.content || []).map((c) => c.text || "").join("");
  }

  if (process.env.OPENROUTER_API_KEY) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "google/gemini-flash-latest", max_tokens: max, messages: [{ role: "system", content: system }].concat(messages) })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
    return j.choices[0].message.content || "";
  }
  return null;
}

module.exports = { enabled, callAI };
