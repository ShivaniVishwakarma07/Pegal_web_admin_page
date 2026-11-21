import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Component/navbar.jsx"; // your sidebar component
import Home from "./Component/Home";
import Invoice from "./Component/Invoice";
import Quotation from "./Component/Quotation.jsx";
import Expenses from "./Component/ Expenses.jsx";
import Clients from "./Component/Clients.jsx";
import Hosting from "./Component/Hosting.jsx";
import Settings from "./Component/Settings.jsx";
import ProjectBillsSection from "./Component/ProjectBillsSection.jsx";
const Placeholder = ({ title }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8">
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    <p className="mt-1 text-sm text-slate-500">This page is coming soon.</p>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Reserves space for the fixed sidebar (260px, or 76px when collapsed) */}
        <div
          className={`min-h-screen transition-[padding] duration-300 ${
            collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"
          }`}
        >
          {/* Mobile top bar with the menu button */}
          <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <span className="ml-2 font-bold text-slate-900">Pegal</span>
          </header>

          <main className="min-w-0 p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/Quotation" element={<Quotation />} />
              <Route path="/Expenses" element={<Expenses />} />
              <Route path="/Clients" element={<Clients />} />
              <Route path="/Hosting" element={<Hosting />} />
              <Route path="/Settings" element={<Settings />} />
              <Route
                path="/support"
                element={<Placeholder title="Help & Support" />}
              />
              <Route
                path="/ProjectBillsSection"
                element={<ProjectBillsSection />}
              />
              <Route path="/projects" element={<ProjectBillsSection />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
