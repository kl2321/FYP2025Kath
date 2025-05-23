let store = {}; // 简单内存存储

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { session, transcript, summary } = req.body;
    store[session] = { transcript, summary };
    return res.status(200).json({ ok: true });
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
