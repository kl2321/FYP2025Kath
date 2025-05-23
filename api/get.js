export default function handler(req, res) {
  const { session } = req.query;
  if (!session) return res.status(400).json({ error: 'Missing session ID' });

  const result = store[session];
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(200).json({});
  }
}
