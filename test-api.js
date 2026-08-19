

async function test() {
    try {
        const res = await fetch('http://127.0.0.1:3005/api/v1/clinics/staff');
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
