const fs = require('fs');
const path = 'components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { BookAppointmentModal } from './AppointmentModals';\n",
  ""
);

fs.writeFileSync(path, content, 'utf8');
console.log('Removed unused import successfully');
