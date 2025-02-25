import { createRoot } from 'react-dom/client'
import './Styles.css'
import App from './App.tsx'
import { UserProvider } from './UserContext' // Import the provider

createRoot(document.getElementById('root')!).render(
    <UserProvider>
      <App />
    </UserProvider>
)
