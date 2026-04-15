exports.handler = async function(event) {
  const ticker = event.queryStringParameters?.ticker || 'AAPL';
  const url = `https://stooq.com/q/l/?s=${ticker.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('no data');

    // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
    const cols = lines[1].split(',');
    const open  = parseFloat(cols[3]);
    const close = parseFloat(cols[6]);
    if (isNaN(close) || close <= 0) throw new Error('invalid price');

    const prev = isNaN(open) ? close : open;
    const change = close - prev;
    const changePct = prev > 0 ? ((close - prev) / prev) * 100 : 0;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), price: close, prev, change, changePct })
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
