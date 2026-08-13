const fs = require('fs');
const path = 'components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { ClinicRegistrationForm }')) {
  const regex = /import \{ BookAppointmentModal \} from '\.\/AppointmentModals';/;
  const replaceStr = "import { BookAppointmentModal } from './AppointmentModals';\nimport { ClinicRegistrationForm } from './ClinicRegistrationForm';";
  content = content.replace(regex, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Import added successfully');
} else {
  console.log('Import already exists');
}
