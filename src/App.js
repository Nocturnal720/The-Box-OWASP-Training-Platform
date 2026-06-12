import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./register";
import Login from "./login";
import Dashboard from "./dashboard";
import FakeBank from "./fakebank/FakeBank";

// ✅ LAB IMPORTS - Using actual Lab components
import AccessAuthLab from "./vulnerabilities/AccessAuthLab";
import DataProtectionLab from "./vulnerabilities/DataProtectionLab";
import InjectionLab from "./vulnerabilities/Injection/InjectionLab";
import InjectionMitigation from "./vulnerabilities/Injection/InjectionMitigation";
import InsecureDesignLab from "./vulnerabilities/InsecureDesign/InsecureDesignLab";
import InsecureDesignMitigation from "./vulnerabilities/InsecureDesign/InsecureDesignMitigation";
import SecurityMisconfigurationLab from "./vulnerabilities/SecurityMisconfiguration/SecurityMisconfigurationLab";
import SecurityMisconfigurationMitigation from "./vulnerabilities/SecurityMisconfiguration/SecurityMisconfigurationMitigation";

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* FakeBank */}
      <Route path="/fakebank" element={<FakeBank />} />

      {/* LAB ROUTES - Using actual Lab components */}
      <Route path="/lab/access-control" element={<AccessAuthLab />} />
      <Route path="/lab/crypto" element={<DataProtectionLab />} />
      <Route path="/lab/injection" element={<InjectionLab />} />
      <Route path="/lab/injection/basic" element={<InjectionLab />} />
      <Route path="/lab/injection/mitigation" element={<InjectionMitigation />} />
      <Route path="/lab/insecure-design" element={<InsecureDesignLab />} />
      <Route path="/lab/insecure-design/basic" element={<InsecureDesignLab />} />
      <Route path="/lab/insecure-design/mitigation" element={<InsecureDesignMitigation />} />
      <Route path="/lab/misconfig" element={<SecurityMisconfigurationLab />} />
      <Route path="/lab/misconfig/basic" element={<SecurityMisconfigurationLab />} />
      <Route path="/lab/misconfig/mitigation" element={<SecurityMisconfigurationMitigation />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;