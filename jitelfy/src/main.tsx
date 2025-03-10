import { createRoot } from 'react-dom/client'
import './Styles.css'
import App from './App'
import { UserProvider } from './UserContext' // Import the provider

createRoot(document.getElementById('root')!).render(
    <UserProvider>
      <App />
    </UserProvider>
)
