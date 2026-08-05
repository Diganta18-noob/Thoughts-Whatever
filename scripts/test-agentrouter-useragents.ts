async function testUserAgents() {
  const key = "sk-G8R6W0rZUlNiwxnvyuZeFNYgk0CfZuF2Hy29bQqTYIYGeAGw";

  const userAgents = [
    "Cursor/0.45.0",
    "Cursor/0.40.0",
    "Anthropic/v1",
    "OpenAI-Python/1.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/0.45.0 Chrome/122.0.0.0 Safari/537.36",
    "lobe-chat/1.0",
    "NextChat/2.12",
  ];

  for (const ua of userAgents) {
    try {
      console.log(`\nTesting User-Agent: "${ua}"...`);
      const res = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "User-Agent": ua,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-8",
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      console.log(`Status:`, res.status);
      const text = await res.text();
      console.log(`Response:`, text.substring(0, 300));
    } catch (err) {
      console.error(`Error:`, err);
    }
  }
}

testUserAgents();
