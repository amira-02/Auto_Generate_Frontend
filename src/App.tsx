import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthContext";
import { ThemeProvider } from "./hooks/ThemeContext";
import { ClientProvider } from "./hooks/ClientContext";
import AppRouter from "./router/AppRouter";
import "./App.css";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ClientProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;