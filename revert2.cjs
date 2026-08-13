const fs = require('fs');
const path = 'components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{isWalkInExpressOpen && \([\s\S]*?<BookAppointmentModal[\s\S]*?\/>\s*\)\}/m;

const newBlock = "{isWalkInExpressOpen && (\n        <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm\">\n          <ClinicRegistrationForm \n            initialData={walkInInitialData}\n            onCancel={() => {\n              setIsWalkInExpressOpen(false);\n              setWalkInInitialData(undefined);\n            }}\n            onSuccess={(patientId, appointmentId) => {\n              setIsWalkInExpressOpen(false);\n              setWalkInInitialData(undefined);\n              setRefreshTrigger(prev => prev + 1);\n            }}\n          />\n        </div>\n      )}";

content = content.replace(regex, newBlock);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully reverted with regex');
