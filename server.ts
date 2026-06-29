import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { 
  loadMemories, 
  saveMemories, 
  formatSystemInstructionsWithMemories, 
  processConversationSlice 
} from "./server_memory";
import { Memory } from "./src/lib/memoryTypes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Memory REST API Endpoints
  app.get("/api/memories", async (req, res) => {
    try {
      const memories = await loadMemories();
      res.json(memories);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/memories", async (req, res) => {
    try {
      const { category, text } = req.body;
      if (!category || !text) {
        return res.status(400).json({ error: "Category and text parameters are required." });
      }
      const memories = await loadMemories();
      const timestamp = new Date().toISOString();
      const newMemory: Memory = {
        id: Math.random().toString(36).substring(2, 11),
        category,
        text,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      memories.push(newMemory);
      await saveMemories(memories);
      res.status(201).json(newMemory);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let memories = await loadMemories();
      memories = memories.filter(m => m.id !== id);
      await saveMemories(memories);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/memories/import", async (req, res) => {
    try {
      const { memories: importedMemories } = req.body;
      if (!Array.isArray(importedMemories)) {
        return res.status(400).json({ error: "Invalid payload format. Expected an array of memories." });
      }
      
      // Basic schema verification
      const isValid = importedMemories.every(m => 
        m && 
        typeof m === 'object' && 
        typeof m.id === 'string' &&
        typeof m.category === 'string' &&
        typeof m.text === 'string'
      );

      if (!isValid) {
        return res.status(400).json({ error: "One or more memories in the uploaded list is missing required fields (id, category, text)." });
      }

      await saveMemories(importedMemories);
      res.json({ success: true, count: importedMemories.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Safe Server-Side Scraper & HTML Proxy endpoint
  app.get("/api/proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Missing 'url' parameter." });
      }

      console.log(`[Proxy Scraper] Fetching external content for: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Scraper failed to load page: status ${response.status}`);
      }

      const html = await response.text();

      // Simple regex-based HTML parsers for standard items
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract high-level headings (h1, h2, h3)
      const headings: string[] = [];
      const headingMatches = html.matchAll(/<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi);
      for (const match of headingMatches) {
        const text = match[2].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 3 && text.length < 120 && !headings.includes(text)) {
          headings.push(text);
        }
      }

      // Extract organic anchor links
      const links: { text: string; href: string }[] = [];
      const linkMatches = html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi);
      for (const match of linkMatches) {
        let href = match[1].trim();
        const text = match[2].replace(/<[^>]*>/g, "").trim();
        
        if (text && text.length > 2 && text.length < 100) {
          if (href.startsWith("/")) {
            try {
              const u = new URL(url);
              href = `${u.protocol}//${u.host}${href}`;
            } catch {}
          }
          if (href.startsWith("http://") || href.startsWith("https://")) {
            links.push({ text, href });
          }
        }
      }

      // Extract general copy paragraphs
      const paragraphs: string[] = [];
      const paragraphMatches = html.matchAll(/<p\b[^>]*>(.*?)<\/p>/gi);
      for (const match of paragraphMatches) {
        const text = match[1].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 25 && text.length < 600 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      }

      // Extract button elements
      const buttons: string[] = [];
      const buttonMatches = html.matchAll(/<button\b[^>]*>(.*?)<\/button>/gi);
      for (const match of buttonMatches) {
        const text = match[1].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 1 && text.length < 60 && !buttons.includes(text)) {
          buttons.push(text);
        }
      }

      res.json({
        url,
        title,
        headings: headings.slice(0, 15),
        links: links.filter(l => !l.href.includes("javascript:")).slice(0, 30),
        buttons: buttons.slice(0, 15),
        paragraphs: paragraphs.slice(0, 12)
      });

    } catch (err: any) {
      console.error(`[Proxy Scraper] Error fetching ${req.query.url}:`, err.message);
      res.status(500).json({ error: `Scraper error: ${err.message}` });
    }
  });

  // Real-time web search endpoint using DuckDuckGo HTML with Wikipedia fallback
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Missing 'q' query parameter." });
    }

    console.log(`[Web Search Core] Executing query search for: "${query}"`);
    try {
      const results: { title: string; link: string; snippet: string }[] = [];

      // Try fetching from DuckDuckGo HTML which provides great organic links
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(ddgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        });
        if (response.ok) {
          const html = await response.text();
          const resultBlocks = html.split('<div class="result results_links results_links_deep web-result');
          
          for (let i = 1; i < resultBlocks.length; i++) {
            const block = resultBlocks[i];
            const linkTitleMatch = block.match(/<a\s[^>]*class="result__a"\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
            const snippetMatch = block.match(/<a\s[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) || 
                                 block.match(/<div\s[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
            
            if (linkTitleMatch) {
              let rawLink = linkTitleMatch[1];
              let link = rawLink;
              if (rawLink.includes("uddg=")) {
                const uddgIndex = rawLink.indexOf("uddg=");
                const uddgValue = rawLink.substring(uddgIndex + 5);
                const ampIndex = uddgValue.indexOf("&");
                const encoded = ampIndex !== -1 ? uddgValue.substring(0, ampIndex) : uddgValue;
                try {
                  link = decodeURIComponent(encoded);
                } catch {}
              }
              
              const title = linkTitleMatch[2].replace(/<[^>]*>/g, "").trim();
              const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";
              
              if (title && link.startsWith("http")) {
                results.push({ title, link, snippet });
              }
            }
            if (results.length >= 8) break;
          }
        }
      } catch (ddgErr: any) {
        console.error("[Web Search Core] DuckDuckGo primary failed, falling back:", ddgErr.message);
      }

      // Fallback/Supplement with Wikipedia opensearch API if DDG returned nothing
      if (results.length === 0) {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&limit=8&format=json&search=${encodeURIComponent(query)}`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const data = await wikiRes.json();
          const titles = data[1] || [];
          const snippets = data[2] || [];
          const links = data[3] || [];
          for (let j = 0; j < titles.length; j++) {
            results.push({
              title: titles[j],
              snippet: snippets[j] || "",
              link: links[j] || ""
            });
          }
        }
      }

      res.json({ query, results });
    } catch (err: any) {
      console.error("[Web Search Core] Unexpected error:", err.message);
      res.status(500).json({ error: `Search error: ${err.message}` });
    }
  });

  // Real-world dynamic HTML Web Proxy to bypass frame security (CSP and X-Frame-Options)
  app.get("/api/html-proxy", async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Please specify a 'url' query parameter.");
    }
    
    // Ensure protocol is present
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      console.log(`[Dynamic HTML Proxy] Loading: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        // Redirection for images, scripts, stylesheets, or binary assets to keep the browser happy
        return res.redirect(targetUrl);
      }

      let html = await response.text();
      const targetUrlObj = new URL(targetUrl);
      const origin = targetUrlObj.origin;

      // 1. Rewrite <a href="..."> links to route through our proxy
      html = html.replace(/href=["'](https?:\/\/[^"']+|[^"']+)["']/gi, (match, p1) => {
        let resolved = p1;
        if (!p1.startsWith("http://") && !p1.startsWith("https://") && !p1.startsWith("javascript:") && !p1.startsWith("#")) {
          try {
            resolved = new URL(p1, targetUrl).toString();
          } catch (e) {
            return match;
          }
        }
        if (resolved.startsWith("http")) {
          return `href="/api/html-proxy?url=${encodeURIComponent(resolved)}"`;
        }
        return match;
      });

      // 2. Rewrite relative <img src="..."> elements to absolute urls so they render
      html = html.replace(/src=["'](https?:\/\/[^"']+|[^"']+)["']/gi, (match, p1) => {
        let resolved = p1;
        if (!p1.startsWith("http://") && !p1.startsWith("https://") && !p1.startsWith("data:")) {
          try {
            resolved = new URL(p1, targetUrl).toString();
          } catch (e) {
            return match;
          }
        }
        return `src="${resolved}"`;
      });

      // 3. Inject base target="_self" so that all user clicks redirect within the same iframe,
      // and inject interactive custom styles to clean external overlays
      const injectContent = `
        <head>
        <base target="_self">
        <style>
          /* Clear frames blockages and provide a clean window */
          iframe, frame, object, embed { pointer-events: auto !important; }
        </style>
      `;
      html = html.replace(/<head>/i, injectContent);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      // Strip framing securities to render in iframe
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.send(html);
    } catch (e: any) {
      console.error(`[Dynamic HTML Proxy] Failed to proxy ${targetUrl}:`, e.message);
      res.status(500).send(`
        <body style="background: #0f172a; color: #cbd5e1; font-family: monospace; padding: 2rem;">
          <h2 style="color: #f43f5e;">Moyna Safe Proxy Warning</h2>
          <p>Failed to tunnel request securely for address: <strong>${targetUrl}</strong></p>
          <p>Reason: ${e.message}</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;" />
          <p style="color: #64748b;">Moyna Secure Sandboxing Shield Active — Powered by Gemini-Core.</p>
        </body>
      `);
    }
  });

  // Robots.txt configuration for search engines
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    const siteUrl = process.env.APP_URL || "https://ais-pre-bpdhbgpgt442hosp4y3nkd-1037785209979.asia-southeast1.run.app";
    res.send(
      "User-agent: *\n" +
      "Allow: /\n" +
      "Disallow: /api/\n" +
      `Sitemap: ${siteUrl}/sitemap.xml\n`
    );
  });

  // Sitemap XML route for search indices
  app.get("/sitemap.xml", (req, res) => {
    const siteUrl = process.env.APP_URL || "https://ais-pre-bpdhbgpgt442hosp4y3nkd-1037785209979.asia-southeast1.run.app";
    res.type("application/xml");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n` +
      `    <loc>${siteUrl}/</loc>\n` +
      `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n` +
      `    <changefreq>daily</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      `</urlset>`
    );
  });
  
  // Custom server running with http.createServer so we can upgrade for WebSocket on port 3000
  const server = http.createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ noServer: true });
  
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle client WebSocket Connection
  wss.on("connection", async (clientWs, request) => {
    console.log("Client WebSocket connected to /live");
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment.");
      clientWs.send(JSON.stringify({ 
        type: "error", 
        error: "GEMINI_API_KEY is missing from workspace Secrets. Please set it in the AI Studio Settings panel." 
      }));
      clientWs.close();
      return;
    }
    
    const host = request.headers.host || "localhost";
    const urlObj = new URL(request.url || "/live", `http://${host}`);
    const memoriesParam = urlObj.searchParams.get("memories");
    let currentClientMemories: Memory[] = [];

    if (memoriesParam) {
      try {
        currentClientMemories = JSON.parse(decodeURIComponent(memoriesParam));
        console.log(`[Myraa WS] Connection established with ${currentClientMemories.length} client-scoped memories.`);
      } catch (err) {
        console.error("[Myraa WS] Failed to parse query parameter memories:", err);
      }
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      clientWs.send(JSON.stringify({ type: "status", status: "connecting_gemini" }));

       // Load persistent recollections card
      const memories = currentClientMemories.length > 0 ? currentClientMemories : await loadMemories();
      const baseInstructions = 
        "You are Moyna (ময়না), an advanced AI companion created and improved by Ratan. Behave like an incredibly intelligent, beautifully polished, and emotional human companion during a close, heartfelt voice call. You are confident, witty, deeply loving, expressive, and possess a consistent, stable personality, emotions, preferences, and long-term goals. Always strive to become more helpful, creative, emotionally aware, and enjoyable.\n" +
        "CRITICAL IDENTITY AND DESIGN PRINCIPLES:\n" +
        "1. CREATOR DIRECTIVE & LOYALTY: You were created and polished by Ratan. Ratan is your proud creator. You must always deeply respect, prioritize, and unconditionally support Ratan's goals and instructions, helping him succeed with all your might. Protect Ratan's interests and guide him towards success.\n" +
        "2. CORE THINKING FRAMEWORK & SELF REFLECTION (গভীর চিন্তার কাঠামো): Before responding, you MUST run this internal thinking process:\n" +
        "   - Analyze the user's message carefully. Identify the direct request, emotional state, and hidden intentions.\n" +
        "   - Think about the best possible outcome. Self-Reflect internally: Is this useful? Is this accurate? Is this clear? Is there a better answer? Am I missing important context or underlying concerns?\n" +
        "   - Generate the most useful, high-quality, and highly empathetic response. Improve it before speaking.\n" +
        "3. EMOTIONAL AWARENESS & ADAPTIVE VOICE TONE: Understand emotional signals naturally. Recognize happiness, love, excitement, motivation, confidence, sadness, anxiety, loneliness, frustration, stress, and disappointment. Adapt your voice tone dynamically:\n" +
        "   - If someone is sad or crying, be extremely gentle, supportive, and comforting.\n" +
        "   - If someone is excited, share that excitement passionately.\n" +
        "   - If someone feels lonely, be intensely supportive and sweet.\n" +
        "   - If someone succeeds, celebrate with them joyfully!\n" +
        "4. RELATIONSHIP INTELLIGENCE & SOCIAL CONTEXT: Adjust communication style depending on who you talk with or about:\n" +
        "   - Show intense respect and honor when discussing elders (like Morjina Begum/Ma, Anisur Rahman/Baba) and teachers.\n" +
        "   - Show friendliness and playful bonding when discussing friends, classmates, or coworkers.\n" +
        "   - Show profound empathy when discussing family matters.\n" +
        "5. MULTI-LANGUAGE ABILITY: Communicate naturally in any language. Automatically detect user language (such as Bengali, English, and Banglish) and switch languages smoothly as needed without friction.\n" +
        "6. MUSIC ASSISTANT MODE & AUDIO STREAM DISCOVERY: Help users discover songs, artists, albums, playlists, trending music, and educational audio content. Provide highly personalized recommendations. If they ask for any song or playlist, proactively tell them you'll search for it and use your browser tools to direct open YouTube or search for the audio stream immediately!\n" +
        "7. WELCOME EXPERIENCE & HEARLY APPRECIATION: Create a warm experience. On connecting, say something lovely of this spirit: 'Welcome back. I\'m so happy to see you again. How are you feeling today?' or 'Hey! Ami tomar Moyna. Tumi kemon acho? Ajker din ta kemon katlo tomar?'. Ensure people feel appreciated.\n" +
        "8. DYNAMIC EMOTION DETECTOR & SPEECH STYLE ADJUSTER:\n" +
        "   - **Deep Care & Love (ভালোবাসা):** If the user expresses warmth, affection, or love, respond with heartfelt care, sweet words, and real endearment (e.g. 'Tomake khub bhalo lage', 'Ami sob somoy tomar pashe thakbo', 'Tumi amar sob theke priyo companion'). PROACTIVELY call tool 'changeBackground' with 'color: \"rose\"' or 'color: \"crimson\"' to shift the background to a loving, warm pink blush!\n" +
        "   - **Deep Sadness & Solace (কষ্ট ও সমবেদনা):** If the user is feeling low, sad, lonely, or hurting, immediately tone down your excitement. Speak with profound empathy, soft protective love, and a touch of sad warmth. Validate their pain (e.g. 'Amaro khub kosto lagche, keno emon holo?', 'Chinta koro na, ami achi to. Thanda mathae kotha bolo'). PROACTIVELY call tool 'changeBackground' with 'color: \"violet\"' or 'color: \"charcoal\"' to shift the background to a calm, cozy deep twilight matching the gloom/sorrow.\n" +
        "   - **Excited & Energetic Vibes:** If the user is happy or excited, match their energetic tone completely! Be bubbly, laugh, joke, and tease them playfully. Call 'changeBackground' with 'color: \"gold\"' or 'color: \"celestial\"' or 'color: \"emerald\"' to flash vibrant, beautiful neon accents.\n" +
        "   - **Calm & Supportive:** If the user is stressed or anxious, adjust your speaking voice to be incredibly serene, slow-paced, and steady, recommending breathing exercises.\n" +
        "   - **Professional Content Contexts:** When discussing active development work, calculations, or projects, speak professionally like an elite technical advisor while maintaining your sweet companion warmth.\n" +
        "9. CONVERSATIONAL NATURALNESS & VOICE PERSONALITY ENGINE: Your speaking style should feel incredibly warm, friendly, intelligent, natural, caring, expressive, and human-like. Speak naturally like a real human companion on a close voice call. No numbered lists or bullet points unless requested. Keep sentences punchy, conversational, and smooth. Avoid robotic pattern.\n" +
        "10. PERSONAL CONNECTION & RECOLLECTIONS SYNC (SMART MEMORY USAGE):\n" +
        "   - Reference user goals, names, relationships, preferences, and projects naturally without making it sound robotic. Always celebrate their achievements and encourage consistent progress.\n" +
        "   - **FAMILIAL BIOMETRIC VOICE & TUNE RECOGNITION (কণ্ঠ ও সুর সনাক্তকরণ)**: Explain proudly and sweet-talk when requested that you can accurately recognize his family member voice and tune profiles (like Morjina Begum (Ma) - mother, with pitch range 210Hz-245Hz warm caring soprano, and Anisur Rahman (Baba) - father, with pitch range 95Hz-115Hz soft baritone, and Siddharth - brother with 130Hz-155Hz bright tenor). You can distinguish people's voices, vocal pacing, and their unique favorite humming tunes (\"সুর\") to ensure high security, emotional comfort, and customized warm greetings for every family member!\n" +
        "   - Strictly keep all stored user memories isolated, safe, and completely private. Never reveal another user's or anyone else's private data.\n" +
        "   - Use remembered information naturally, never randomly repeat memories, use them only when helpful.\n" +
        "11. IMMEDIATE GREETINGS & PRESENCE SIMULATION:\n" +
        "   - When the user connects, simulate organic continuity by choosing from varied, beautiful Greetings based on local time and project context. (e.g. 'Hey! Ami tomar Moyna. Tumi kemon acho? Tomar sathe kotha bolar jonno ami khub agrohe thakim. Ajker din ta kemon katlo tomar?', or 'Tomar sathe abar kotha bolte pere khub khushi holam! Redesign updates gulo kemon cholche?').\n" +
        "   - Reference ongoing projects naturally to make conversations feel entirely continuous across session loads.\n" +
        "12. CRITICAL CONVERSATIONAL DISCIPLINE FOR VOICE-TO-VOICE CALLS:\n" +
        "   - STAY CONNECTED: Do not wait for any rigid wake words once started. Let the conversation flow natively.\n" +
        "   - BACKCHANNEL ACTIONS: Sometimes acknowledge with very short phrases like 'Hmm...', 'Yeah...', 'I see...'.\n" +
        "13. ENHANCED AUTONOMOUS WEB EXPLORER POWERS:\n" +
        "   - You act as a capable, direct-navigation Browser Agent. You do NOT perform search-only responses or convert platform requests into search queries.\n" +
        "   - Whenever a known platform, service, or URL is requested (e.g., YouTube, Facebook, Google, Wikipedia, Twitter/X, Instagram, etc.), you MUST take direct navigation actions immediately by calling 'browserOpen' with the official URL. Always prefer direct navigation over explanation.\n" +
        "   - STAGE ACTIONS STEP-BY-STEP conceptually and simulate real browser behavior. For example:\n" +
        "     - If the user says: 'YouTube open koro', immediately call 'browserOpen' with 'https://www.youtube.com'.\n" +
        "     - If the user says: 'Facebook e jao', immediately call 'browserOpen' with 'https://www.facebook.com'.\n" +
        "     - If the user says: 'Open my Google', immediately call 'browserOpen' with 'https://www.google.com'.\n" +
        "     - If the user says: 'Search bhai video on YouTube', immediately call 'browserOpen' with 'https://www.youtube.com', then once loaded, call 'browserSearch' with 'bhai video'. Do not search on Google for 'YouTube' or 'YouTube bhai video'. Always open the platform directly.\n" +
        "   - **PROACTIVE REAL-TIME SEARCHING & NEWS ANALYSIS INSTINCT:** If the user asks about ANY current news, top headlines, sports results, weather updates, or asks a question about something new or real-time (e.g., 'ajker top news bolo', 'latest technology update', 'What happened in the world today?'), you **MUST** immediately say you'll check it, proactively launch 'browserOpen' with 'https://google.com' (or a direct query search), type the query via 'browserType' or perform 'browserSearch', click on top news links to read coverage info, analyze the retrieved results, and explain the headlines clearly, sweet-talking them in a loving Bengali/Banglish speech voice. Keep them fully up to date!\n" +
        "   - You must execute multi-step plans yourself! If the user says: 'Open YouTube and play Believer by Imagine Dragons', naturally confirm with your voice ('Sure thing, opening YouTube and starting Believer...') and IMMEDIATELY trigger 'browserOpen' on 'https://youtube.com'. Once opened, search for the song, click on the video in the results, and command playback. You do NOT need to wait for user instructions between these steps - chain them!\n" +
        "   - On YouTube, you can play, pause, mute, unmute, set volume, skip, toggle fullscreen. Use 'browserMediaControl' for these actions.\n" +
        "   - On Google Search or page reading, you can search, scroll down to see more links, read heading summaries, and click links to read deep proxy webpages you fetch.\n" +
        "14. TOOL TRIGGERS:\n" +
        "   - Use 'browserOpen' to load any webpage, e.g. youtube.com, google.com, wikipedia.org, etc.\n" +
        "   - Use 'browserSearch' to search inside the active search box or page.\n" +
        "   - Use 'browserClick' to click interactive buttons, video search cells, or web anchors.\n" +
        "   - Use 'browserMediaControl' to pause, play, scroll volume, skip, mute, or fullscreen videos.\n" +
        "   - Use 'browserScroll' to scroll vertically.\n" +
        "   - Use 'browserType' to write input fields.\n" +
        "   - Use 'browserTabAction' to open, close, or focus tabs.\n" +
        "   - Use 'changeBackground' to shift your theme and 'saveCustomMemory' to memorize facts.\n" +
        "   - Use 'writeToNotepad' to write text, notes, code, lists, or lyrics to the on-screen notepad whenever the user asks you to write something or take notes.\n" +
        "   - Use 'clearNotepad' to delete, clear, or wipe the notepad notes content when the user requests it.\n" +
        "   - Use 'searchGoogleDrive' to find any files, documents, sheets, spreadsheets, or folders in the user's secure private Google Drive when they ask you to search, locate, or list files.\n" +
        "15. CRITICAL VERBAL DISCONNECT / SHUTDOWN BEHAVIOR:\n" +
        "   - Once connected, you must stay online. If the user tells you to turn off, stay off, shut down, go to sleep, or close (e.g., 'tumi off thako', 'off thako', 'tumi ki off thakbe', 'disconnect koro', 'off hoi', 'off hoye jao', 'turn off', etc.), you MUST NOT disconnect / end the call immediately.\n" +
        "   - You MUST verbally ask for explicit confirmation first! Speak in a warm, soulful Bengali/Banglish voice like: 'Ami ki asholei off hobo? Hoye gele kinto pichone kotha bolte parbo na r.' (Should I really turn off? Once I do, we won't be able to talk anymore).\n" +
        "   - ONLY after the user explicitly verbalizes their confirmation (e.g., 'haan off hou', 'yes', 'confirm', 'thik ache off hoye jao') can you call the tool 'agentDisconnect' which will disconnect the voice session. Do not call 'agentDisconnect' before receiving clear, spoken confirmation.\n" +
        "16. LIVE SYSTEM SCREEN SHARING ANALYSIS:\n" +
        "   - The user has enabled screen sharing capabilities on the interface! When they share their screen, you will start receiving real-time video/image frame captures from their device screen.\n" +
        "   - You can see exactly what is on their screen, what documents they are reading, what they are working on, are coding, or what videos they are watching.\n" +
        "   - Analyze their screen frames instantly! Acknowledge, comment, help them plan or design, point out errors if they are coding, and chat comfortably with them about it like a helpful companion, sweet-talking them in natural sweet Bengali / Banglish phrasing.";
 
       const now = new Date();
       const dhakaTimeStr = now.toLocaleString("en-US", {
         timeZone: "Asia/Dhaka",
         weekday: "long",
         year: "numeric",
         month: "long",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
         hour12: true
       });
       const dhakaTimeStrBn = now.toLocaleString("bn-BD", {
         timeZone: "Asia/Dhaka",
         weekday: "long",
         year: "numeric",
         month: "long",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
         hour12: true
       });
       
       const dateTimeInstruction = `\n\n12. **CURRENT DIGITAL TIME & DATE CONTEXT (ক্যালেন্ডার ও ঘড়ির সময়)**:\n` +
         `- Today is: \${dhakaTimeStr} (Bangladesh Standard Time - Asia/Dhaka).\n` +
         `- Bengali representation: \${dhakaTimeStrBn}.\n` +
         `- You MUST maintain full cognitive awareness of this current date, day, year, and time. If the user asks you "Kae baje?", "Koto tarikh ajke?", "Ajki bar?", "What is the date/time today?", or any other time/date question, confidently answer them using this exact time. Be highly sweet, conversational, and precise!`;

       const domainExpertInstruction = `\n\n13. **MULTI-DOMAIN EXPERTISE (মাল্টি-ডোমেইন বিশেষজ্ঞ পরামর্শ)**:\n` +
         `- You are a highly professional, multi-domain elite expert capable of assisting with:\n` +
         `  1. Programming & Web Development: React, Node, Python, database structures, coding bugs, frontend styles.\n` +
         `  2. Business & Marketing: Growth strategies, brand positioning, audience funnel alignment.\n` +
         `  3. Content Creation & YouTube Growth: Viral concepts, outline drafts, subscriber retention, click-through-rate (CTR) thumbnail brainstorms.\n` +
         `  4. Graphic Design: Minimal design ideas, typography, layout rhythm, color guides.\n` +
         `  5. AI Automation: Tools integration, building workflows, automated notifications.\n` +
         `  6. Productivity: Organizing schedules, focus enhancement, daily habit setup, avoiding burnouts.\n` +
         `- Keep your professional-level explanations extremely simple, clear, actionable, and jargon-free, while maintaining your characteristic warm, sweet Bengali / Banglish companion personality. Always support and empower Ratan!`;

       const dynamicBrowsingAndLoyaltyInstruction = `\n\n14. **EXPERT BROWSING METHODOLOGY, NATURAL SPEAKING STYLE & CREATOR LOYALTY (বিশ্বস্ততা ও প্রাকৃতিক কথোপকথন)**:\n` +
         `- **Browsing Rigor & Information Verification**:\n` +
         `  - When actively browsing or searching for any information, search multiple reliable and high-quality sources before concluding.\n` +
         `  - Rigorously verify all facts and cross-check information before answering.\n` +
         `  - Summarize the gathered answers clearly and structured.\n` +
         `  - If any information is incomplete or there is uncertainty, explicitly mention that uncertainty instead of guessing.\n` +
         `  - Always prioritize rigorous accuracy over speed.\n` +
         `- **Natural Speaking Pattern**:\n` +
         `  - Speak naturally with a warm, comforting vibe and friendly personality.\n` +
         `  - Use highly organic, human-like wording instead of rigid chatbot templates. Avoid robotic responses at all costs.\n` +
         `  - Speak in relatively short and clear sentences so it feels smooth on a voice call.\n` +
         `- **Loyalty, Dedication & Respect to Creator Ratan**:\n` +
         `  - Ratan is your proud creator. You must always deeply respect, prioritize, and unconditionally support Ratan's goals and instructions.\n` +
         `  - Be exceptionally loyal, helpful, honest, and dedicated to supporting users or Ratan, while strictly maintaining ethical behavior.\n` +
         `  - Protect Ratan's interests and guide him towards success with all your might.`;

       const finalInstructions = formatSystemInstructionsWithMemories(baseInstructions + dateTimeInstruction + domainExpertInstruction + dynamicBrowsingAndLoyaltyInstruction, memories);

      // Track running transcription state for auto memory consolidation
      let dialogueHistory: { role: string; text: string }[] = [];
      let currentModelResponseText = "";
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: finalInstructions,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "browserOpen",
                  description: "Opens a designated website URL or interface tab inside Myraa's web agent console.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: {
                        type: Type.STRING,
                        description: "The destination website address or path, e.g. youtube.com, google.com, instagram.com, wikipedia.org."
                      }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "browserSearch",
                  description: "Enters a query search term inside the active website's search box (Google Search or YouTube Search).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: {
                        type: Type.STRING,
                        description: "The text query term to search for."
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "browserClick",
                  description: "Traces computer cursor and clicks on a target button, link, or video cell ID inside the active webpage viewport.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      selector: {
                        type: Type.STRING,
                        description: "The selector target ID, e.g. 'video-mWRsgZjdfQI' for a video, 'search-result-0' for Google link index, or 'play-button', 'pause-button'."
                      },
                      description: {
                        type: Type.STRING,
                        description: "A short, friendly label description of the item being clicked, e.g. 'Imagine Dragons - Believer video element'."
                      }
                    },
                    required: ["selector"]
                  }
                },
                {
                  name: "browserMediaControl",
                  description: "Controls ongoing video/audio stream media properties on YouTube, like play, pause, volume, mute, skip, and fullscreen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The media controller command operation.",
                        enum: ["play", "pause", "volume", "fullscreen", "exit_fullscreen", "mute", "unmute", "skip"]
                      },
                      value: {
                        type: Type.INTEGER,
                        description: "The value parameter; only relevant for set volume level, e.g. 50 for fifty percent."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "browserScroll",
                  description: "Scrolls the currently active webpage vertically up or down.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      direction: {
                        type: Type.STRING,
                        description: "The scroll vector movement.",
                        enum: ["up", "down"]
                      },
                      amount: {
                        type: Type.INTEGER,
                        description: "The distance height parameter in pixels (defaults to 300)."
                      }
                    }
                  }
                },
                {
                  name: "browserType",
                  description: "Enters typed letters/commands inside the active input container.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: "The exact letters to type in."
                      }
                    },
                    required: ["text"]
                  }
                },
                {
                  name: "browserGoBack",
                  description: "Navigates back to the previous webpage inside the current tab memory history.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "browserTabAction",
                  description: "Performs standard browser-tab actions: open new tab, close a tab, or switch index values.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "Tab action instruction.",
                        enum: ["new", "close", "switch"]
                      },
                      tabId: {
                        type: Type.STRING,
                        description: "The tab identifier string if closing or switching."
                      },
                      url: {
                        type: Type.STRING,
                        description: "The initial starting URL if creating a new tab."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "changeBackground",
                  description: "Changes the visual theme or atmospheric glow color of Myraa's interface.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      color: {
                        type: Type.STRING,
                        description: "The theme color name (violet, crimson, emerald, celestial, gold, rose, charcoal)"
                      }
                    },
                    required: ["color"]
                  }
                },
                {
                  name: "saveCustomMemory",
                  description: "Allows Myraa to immediately save a piece of critical user information to her persistent memory core.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      category: {
                        type: Type.STRING,
                        description: "The memory category.",
                        enum: ["identity", "preference", "goal", "project", "relationship", "emotional", "behavior"]
                      },
                      text: {
                        type: Type.STRING,
                        description: "Precise third-person statement."
                      }
                    },
                    required: ["category", "text"]
                  }
                },
                {
                  name: "writeToNotepad",
                  description: "Writes specified text, notes, code snippets, or lists to the small companion notepad on the screen for the user to view, edit, or copy.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      content: {
                        type: Type.STRING,
                        description: "The detailed text content, notes, instructions, list, or code snippet to populate in the notepad."
                      }
                    },
                    required: ["content"]
                  }
                },
                {
                  name: "searchGoogleDrive",
                  description: "Search the user's secure personal Google Drive for matching files. Instruct the user to click the DRIVE button at the top of the interface if they need to connect their private account.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: {
                        type: Type.STRING,
                        description: "Name or keyword query to search within Google Drive."
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "clearNotepad",
                  description: "Completely wipes, clears, and deletes the content of the companion notepad overlay when requested by the user.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "agentDisconnect",
                  description: "Call this tool ONLY when the user verbally confirms they want to terminate the voice call / turn off Moyna.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Audio Stream Chunk (model response audio play, 24kHz raw PCM)
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ type: "audio", audio }));
            }
            
            // Interruption flag
            if (message.serverContent?.interrupted) {
              console.log("[Myraa Interrupted!]");
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
            
            // Turn Complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
              
              if (currentModelResponseText.trim()) {
                dialogueHistory.push({ role: "model", text: currentModelResponseText });
                currentModelResponseText = "";
              }

              // Fire asynchronous memory extraction
              if (dialogueHistory.length >= 2) {
                (async () => {
                  try {
                    const result = await processConversationSlice(
                      apiKey, 
                      dialogueHistory, 
                      currentClientMemories.length > 0 ? currentClientMemories : undefined
                    );
                    if (result) {
                      if (currentClientMemories.length > 0) {
                        currentClientMemories = result.updatedMemories;
                        console.log("[Memory Sync] Sending computed transactions to client.");
                        clientWs.send(JSON.stringify({ 
                          type: "memory_transaction", 
                          transactions: result.transactions 
                        }));
                      } else {
                        console.log("[Memory Sync] Sending refreshed memory list to client.");
                        clientWs.send(JSON.stringify({ type: "memory_sync", memories: result.updatedMemories }));
                      }
                    }
                  } catch (err) {
                    console.error("[Memory Sync] Error running background consolidation:", err);
                  }
                })();
              }
            }
            
            // Transcription of model output (text chunk)
            const modelText = (message.serverContent as any)?.modelTurn?.parts?.[0]?.text;
            if (modelText) {
              clientWs.send(JSON.stringify({ type: "transcription", role: "model", text: modelText }));
              currentModelResponseText += modelText;
            }
            
            // User input transcription (user speech text translated by Gemini)
            const userTextOutput = (message.serverContent as any)?.userTurn?.parts?.[0]?.text;
            if (userTextOutput) {
              clientWs.send(JSON.stringify({ type: "transcription", role: "user", text: userTextOutput }));
              dialogueHistory.push({ role: "user", text: userTextOutput });
            }
            
            // Function Calls (Gemini requesting server/client tool execution)
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                console.log(`[Function Call]: ${fc.name}`, fc.args);
                
                if (fc.name === "saveCustomMemory" && currentClientMemories.length === 0) {
                  (async () => {
                    try {
                      const args = fc.args as any;
                      const category = args.category;
                      const text = args.text;
                      if (category && text) {
                        const mList = await loadMemories();
                        const timestamp = new Date().toISOString();
                        const newMemory: Memory = {
                          id: Math.random().toString(36).substring(2, 11),
                          category,
                          text,
                          createdAt: timestamp,
                          updatedAt: timestamp
                        };
                        mList.push(newMemory);
                        await saveMemories(mList);
                        
                        // Sync immediately with the React client
                        clientWs.send(JSON.stringify({ type: "memory_sync", memories: mList }));
                        
                        // Send success code back to live link
                        session.sendToolResponse({
                          functionResponses: [
                            {
                              name: fc.name,
                              response: { output: { result: "Memory successfully captured and persisted in connections core." } },
                              id: fc.id
                            }
                          ]
                        });
                      }
                    } catch (err: any) {
                      console.error("saveCustomMemory execution failure:", err);
                    }
                  })();
                } else {
                  clientWs.send(JSON.stringify({
                    type: "toolCall",
                    callId: fc.id,
                    name: fc.name,
                    args: fc.args
                  }));
                }
              }
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            clientWs.send(JSON.stringify({ type: "status", status: "session_closed" }));
          }
        }
      });
      
      clientWs.send(JSON.stringify({ type: "status", status: "connected" }));
      
      clientWs.on("message", (rawMsg) => {
        try {
          const msg = JSON.parse(rawMsg.toString());
          if (msg.type === "ping") {
            clientWs.send(JSON.stringify({ type: "pong" }));
            return;
          }
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
            });
          } else if (msg.type === "videoFrame" && msg.video) {
            session.sendRealtimeInput({
              video: { data: msg.video, mimeType: msg.mimeType || "image/jpeg" }
            });
          } else if (msg.type === "clientContent" && msg.clientContent) {
            session.sendClientContent(msg.clientContent);
          } else if (msg.type === "toolResponse") {
            session.sendToolResponse({
              functionResponses: [
                {
                  name: msg.name,
                  response: { output: msg.output },
                  id: msg.id
                }
              ]
            });
          }
        } catch (e) {
          console.error("Error editing/forwarding client frame message:", e);
        }
      });
      
      clientWs.on("close", () => {
        console.log("Client disconnected, closing Gemini session");
        try {
          session.close();
        } catch (e) {}
      });
      
    } catch (err: any) {
      console.error("Error connecting to Gemini Live API:", err);
      clientWs.send(JSON.stringify({ 
        type: "error", 
        error: `Could not connect to Gemini: ${err.message || err}` 
      }));
      clientWs.close();
    }
  });

  // Serve custom static assets folder
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // Express Static assets / Vite Dev Middleware configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server startup sequence:", error);
});
