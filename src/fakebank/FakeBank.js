import { useState } from "react";
import BankLogin    from "./pages/BankLogin";
import Dashboard    from "./pages/Dashboard";
import TransferMon  from "./pages/TransferMon";
import Transactions from "./pages/Transactions";
import Profile      from "./pages/Profile";
import Payees       from "./pages/Payees";
import Scheduled    from "./pages/Scheduled";
import Support      from "./pages/Support";
import Loans        from "./pages/Loans";
import Flags        from "./pages/Flags";
import VulnPopup    from "./components/VulnPopup";
import SuccessPopup from "./components/SuccessPopup";

export default function FakeBank() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const props = { setPage, setUser, user };

  const renderPage = () => {
    switch (page) {
      case "transfer":     return <TransferMon  {...props} />;
      case "transactions": return <Transactions {...props} />;
      case "profile":      return <Profile      {...props} />;
      case "payees":       return <Payees       {...props} />;
      case "scheduled":    return <Scheduled    {...props} />;
      case "loans":        return <Loans        {...props} />;
      case "support":      return <Support      {...props} />;
      case "flags":        return <Flags        {...props} />;
      default:             return <Dashboard    {...props} />;
    }
  };

  return (
    <>
      {!user ? <BankLogin setUser={setUser} /> : renderPage()}
      <VulnPopup />
      <SuccessPopup />
    </>
  );
}
