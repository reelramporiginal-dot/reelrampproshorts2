import { Outlet, Route, Routes } from 'react-router-dom';
import './tokens.css';
import { BottomNav } from './ui';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Series from './pages/Series';
import Watch from './pages/Watch';
import Rewards from './pages/Rewards';
import PaymentReturn from './pay/PaymentReturn';
import Stub from './pages/Stub';

function Layout() {
  return (
    <div className="rr2 pb-[calc(72px+env(safe-area-inset-bottom))]">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export default function V2App() {
  return (
    <>
    <PaymentReturn />
    <Routes>
      <Route path="watch/:id" element={<div className="rr2" style={{ paddingTop: 0 }}><Watch /></div>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="series/:title" element={<Series />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="profile" element={<Stub name="Profile" stage="S5" />} />
        <Route path="*" element={<Stub name="Nahi mila" stage="404" />} />
      </Route>
    </Routes>
    </>
  );
}
