const fs = require('fs');

async function test() {
    const env = fs.readFileSync('D:/DFO_Backend/control-tower-core/.env', 'utf8');
    let url = '';
    let key = '';
    env.split('\n').forEach(l => {
        if (l.startsWith('SUPABASE_URL=')) url = l.split('=')[1].trim();
        if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.split('=')[1].trim();
    });

    const res = await fetch(`${url}/rest/v1/sakhi_clinic_users?select=*`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    const data = await res.json();
    fs.writeFileSync('out2.json', JSON.stringify(data, null, 2));
}
test();
