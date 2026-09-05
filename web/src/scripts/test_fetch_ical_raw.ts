async function testFetchCom() {
  const url = "https://www.airbnb.com/calendar/ical/1755956755440220486.ics?t=d1dbd8223be44705aa08ff9a8d3a07f7";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept": "text/calendar, text/plain, */*",
    },
  });

  console.log("HTTP Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("ICS Content Length:", text.length);
  console.log("ICS Preview (first 1000 chars):\n", text.slice(0, 1000));
}

testFetchCom().catch(console.error);
