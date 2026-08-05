async function testTokens() {
  const tokens = [
    "sk-G8R6W0rZUlNiwxnvyuZeFNYgk0CfZuF2Hy29bQqTYIYGeAGw",
  ];

  const endpoints = [
    "https://agentrouter.org/v1/chat/completions",
    "https://agentrouter.org/api/v1/chat/completions",
    "https://agentrouter.org/v1/messages",
  ];

  for (const token of tokens) {
    for (const ep of endpoints) {
      try {
        console.log(`\nTesting EP: ${ep} with Token: ${token.substring(0, 10)}...`);
        const res = await fetch(ep, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-key": token,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-opus-4-8",
            messages: [{ role: "user", content: "Hello" }],
          }),
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 250));
      } catch (err) {
        console.error("Err:", err);
      }
    }
  }
}

testTokens();
