const fs = require('fs');
const path = 'components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { BookAppointmentModal } from './AppointmentModals';",
  "import { BookAppointmentModal } from './AppointmentModals';\nimport { ClinicRegistrationForm } from './ClinicRegistrationForm';"
);

const searchStr = "{isWalkInExpressOpen && (\n        <BookAppointmentModal";
const endStr = "/>\n      )}";
const startIndex = content.indexOf("{isWalkInExpressOpen && (\n        <BookAppointmentModal");

if (startIndex !== -1) {
  const endIndex = content.indexOf(endStr, startIndex) + endStr.length;
  const newBlock = "{isWalkInExpressOpen && (\n        <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm\">\n          <ClinicRegistrationForm \n            initialData={walkInInitialData}\n            onCancel={() => {\n              setIsWalkInExpressOpen(false);\n              setWalkInInitialData(undefined);\n            }}\n            onSuccess={(patientId, appointmentId) => {\n              setIsWalkInExpressOpen(false);\n              setWalkInInitialData(undefined);\n              setRefreshTrigger(prev => prev + 1);\n            }}\n          />\n        </div>\n      )}";
  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully reverted');
} else {
  console.log('Could not find block to replace');
}
