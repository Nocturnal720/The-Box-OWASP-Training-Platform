import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { getAccountDetails } from "../services/bankApi";

export default function Profile({ setPage }) {
  const userId = localStorage.getItem("userId") || 1;

  const [account, setAccount] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await getAccountDetails(userId);
    setAccount(data);
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
  <h2>FakeBank</h2>

  <div className="menu">
    <p
      className={active === "dashboard" ? "active" : ""}
      onClick={() => setPage("dashboard")}
    >
      Dashboard
    </p>

    <p
      className={active === "transactions" ? "active" : ""}
      onClick={() => setPage("transactions")}
    >
      Transactions
    </p>

    <p
      className={active === "transfer" ? "active" : ""}
      onClick={() => setPage("transfer")}
    >
      Transfer
    </p>

    <p
      className={active === "profile" ? "active" : ""}
      onClick={() => setPage("profile")}
    >
      Profile
    </p>
  </div>
</div>

      <div className="main">
        <h2>Profile</h2>

        {account && (
          <div className="profile-card">
            <p><strong>Account No:</strong> {account.account_number}</p>
            <p><strong>IFSC:</strong> {account.ifsc}</p>
            <p><strong>Type:</strong> {account.account_type}</p>
            <p><strong>Branch:</strong> {account.branch}</p>
            <p><strong>Balance:</strong> ₹{account.balance}</p>
          </div>
        )}
      </div>
    </div>
  );
}