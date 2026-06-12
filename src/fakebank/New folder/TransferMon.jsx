import { useState } from "react";
import "../styles/TransferMon.css";
import { transferMoney } from "../services/bankApi";

export default function TransferMon({ setPage, setUser }) {
  const userId = localStorage.getItem("userId") || 1;

  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState("");

  const handleTransfer = async () => {
    if (!toUser || !amount) return;

    const val = parseInt(amount);

    try {
      await transferMoney({
        from_user: userId,
        to_user: parseInt(toUser),
        amount: val,
      });

      alert(`Transferred ₹${val} to User ${toUser}`);

      setToUser("");
      setAmount("");
    } catch (err) {
      console.error(err);
      alert("Transfer failed");
    }
  };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
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

      {/* MAIN */}
      <div className="main">
        <h2>Transfer Money</h2>

        <div className="transfer-wrapper">
          <div className="transfer-card">
            <input
              type="text"
              placeholder="Recipient User ID"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button onClick={handleTransfer}>Send Money</button>

            <button className="back" onClick={() => setPage("dashboard")}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}