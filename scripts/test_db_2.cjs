const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
    const names = ['members', 'patient_profiles', 'patients', 'leads', 'registrations'];
    for (const name of names) {
        const { data } = await supabase.from(name).select('*').limit(1);
        console.log(`${name}: ${!!data}`);
    }
}
test();
