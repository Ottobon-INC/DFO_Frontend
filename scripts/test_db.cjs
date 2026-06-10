const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('Users:', !!data);
    const { data: p, error: pe } = await supabase.from('patients').select('*').limit(1);
    console.log('Patients:', !!p, pe?.message);
}
test();
