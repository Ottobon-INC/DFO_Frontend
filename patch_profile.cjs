const fs = require('fs');
const path = 'components/PatientProfile.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert import
content = content.replace(
    /import toast from 'react-hot-toast';/,
    "import toast from 'react-hot-toast';\nimport AbhaIntegrationWidget from './AbhaIntegrationWidget';"
);

// Insert widget
content = content.replace(
    /\{\/\* Assigned Staff \*\/\}/,
    "<AbhaIntegrationWidget patient={patient} onUpdate={fetchPatientDetails} />\n\n                                            {/* Assigned Staff */}"
);

fs.writeFileSync(path, content);
