import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { LifeInfo } from './pages/LifeInfo';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { News } from './pages/News';
import { Dining } from './pages/Dining';
import { DiningDetail } from './pages/DiningDetail';
import { Publish } from './pages/Publish';
import { Forum } from './pages/Forum';
import { ForumDetail } from './pages/ForumDetail';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="life-info" element={<LifeInfo />} />
              <Route path="news" element={<News />} />
              <Route path="dining" element={<Dining />} />
              <Route path="dining/:id" element={<DiningDetail />} />
              <Route path="forum" element={<Forum />} />
              <Route path="forum/:id" element={<ForumDetail />} />
              <Route path="publish" element={<Publish />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
