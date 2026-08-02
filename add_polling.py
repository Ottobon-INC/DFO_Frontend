import os

filepath = r'c:\Users\adrad\OneDrive\Desktop\dfo-frontend\components\AppointmentsView.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the useEffect that fetches data
old_use_effect = """        fetchAppointments();
    }, []);"""

new_use_effect = """        fetchAppointments();
        
        // Polling every 15 seconds for real-time queue updates
        const intervalId = setInterval(() => {
            fetchAppointments();
        }, 15000);
        
        return () => clearInterval(intervalId);
    }, []);"""

if old_use_effect in content:
    content = content.replace(old_use_effect, new_use_effect)
else:
    print("Warning: old_use_effect not found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
