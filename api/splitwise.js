export default async function handler(req, res) {
  const SPLITWISE_API_KEY = 'xYYB9LedvoThmgwI7WcTOhLAsATbmeHTUmrAGy6U';
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.query.action === 'getExpenses') {
      // Obtener grupos
      const groupsRes = await fetch('https://secure.splitwise.com/api/v3.0/get_groups', {
        headers: { 'Authorization': `Bearer ${SPLITWISE_API_KEY}` }
      });
      const groupsData = await groupsRes.json();
      
      let groupId = null;
      for (let g of groupsData.groups) {
        if (g.name === 'Ayala Codeghini') { groupId = g.id; break; }
      }
      
      if (!groupId) {
        return res.status(400).json({ error: 'Grupo no encontrado' });
      }

      // Obtener gastos
      const expRes = await fetch(
        `https://secure.splitwise.com/api/v3.0/get_expenses?group_id=${groupId}&limit=20`,
        { headers: { 'Authorization': `Bearer ${SPLITWISE_API_KEY}` } }
      );
      const expData = await expRes.json();

      const expenses = (expData.expenses || [])
        .filter(e => !e.deleted_at)
        .map(e => ({
          id: e.id,
          description: e.description,
          cost: e.cost,
          date: e.date ? e.date.substring(0, 10) : '',
          created_by: e.created_by ? e.created_by.first_name : ''
        }));

      return res.status(200).json({ expenses, groupId });
    }

    if (req.method === 'POST' && req.query.action === 'addExpense') {
      const { description, cost, groupId } = req.body;

      await fetch('https://secure.splitwise.com/api/v3.0/create_expense', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cost: parseFloat(cost).toFixed(2),
          description,
          date: new Date().toISOString(),
          group_id: groupId,
          split_equally: true
        })
      });

      return res.status(200).json({ success: true });
    }

    res.status(400).json({ error: 'Acción no soportada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
