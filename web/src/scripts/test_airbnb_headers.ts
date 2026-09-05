async function testAirbnbHeaders() {
  const url = "https://www.airbnb.com/calendar/ical/1755956755440220486.ics?t=d1dbd8223be44705aa08ff9a8d3a07f7&locale=en";

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "curl/8.4.0",
  ];

  for (const agent of userAgents) {
    console.log(`\nTesting User-Agent: ${agent.slice(0, 40)}...`);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": agent,
          "Accept": "text/calendar, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      console.log("HTTP Status:", res.status, res.statusText);
      const text = await res.text();
      const isValidIcs = text.includes("BEGIN:VCALENDAR") || text.includes("BEGIN:VEVENT");
      console.log("Is Valid ICS?", isValidIcs, "| Length:", text.length);
      if (isValidIcs) {
        console.log("ICS Preview:\n", text.slice(0, 300));
        break;
      }
    } catch (e: any) {
      console.error("Fetch Error:", e.message);
    }
  }
}

testAirbnbHeaders();
