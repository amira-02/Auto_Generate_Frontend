import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthContext";
import { ThemeProvider } from "./hooks/ThemeContext";
import AppRouter from "./router/AppRouter";
import "./App.css";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;