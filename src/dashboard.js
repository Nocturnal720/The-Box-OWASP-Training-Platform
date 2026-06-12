import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./styles/Dashboard.css";

const vulnerabilityCategories = [
  {
    num: "01",
    icon: "🔍",
    title: "Access & Authorization",
    tagline: "Can you access what you shouldn't?",
    desc: "When systems trust user input for access control, attackers can bypass protections. Explore how unauthorized access happens through direct URL manipulation and ID enumeration.",
    to: "/lab/access-control",
    label: "Learn",
    color: "access"
  },
  {
    num: "02",
    icon: "🔐",
    title: "Data Protection",
    tagline: "Is your data actually encrypted?",
    desc: "Discover why encoding isn't encryption, how secrets leak in configs, and what happens when cryptography is implemented incorrectly.",
    to: "/lab/crypto",
    label: "Learn",
    color: "crypto"
  },
  {
    num: "03",
    icon: "💉",
    title: "Input Interpretation",
    tagline: "What if your input becomes a command?",
    desc: "When user input is trusted and passed to interpreters (SQL, file systems, shells), attackers can inject commands. Learn injection attacks and prevention.",
    to: "/lab/injection",
    label: "Learn",
    color: "injection"
  },
  {
    num: "04",
    icon: "🏗️",
    title: "System Architecture",
    tagline: "Is your app logic actually secure?",
    desc: "Poor design decisions enable attackers to bypass entire security layers. Understand how architecture flaws lead to exploitable weaknesses.",
    to: "/lab/insecure-design",
    label: "Learn",
    color: "design"
  },
  {
    num: "05",
    icon: "⚙️",
    title: "Configuration & Exposure",
    tagline: "What did they accidentally leave exposed?",
    desc: "Debug modes, default settings, and exposed configs leak sensitive information. Learn what attackers look for in misconfigured systems.",
    to: "/lab/misconfig",
    label: "Learn",
    color: "config"
  },
  {
    num: "06",
    icon: "🏦",
    title: "Fake Bank Challenge",
    tagline: "Can you exploit a real banking app?",
    desc: "Put your skills to the test. Interact with a vulnerable banking system and use your knowledge to discover and exploit its weaknesses.",
    to: "/fakebank",
    label: "Enter Bank",
    color: "fakebank",
    accent: true
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearAuthState = () => {
    [
      "token",
      "labToken",
      "bankToken",
      "user",
      "username",
      "userId",
      "labUserId",
      "assignedVulns",
      "labAssignedVulns",
      "bankUser",
      "bankAssignedVulns"
    ].forEach((key) => localStorage.removeItem(key));
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const token = localStorage.getItem("token") || localStorage.getItem("labToken") || "";
    const storedUserId = localStorage.getItem("userId") || localStorage.getItem("labUserId");
    const resolvedUserId = storedUserId ? Number(storedUserId) : null;

    try {
      await fetch("http://localhost:5000/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {})
        },
        body: JSON.stringify({
          user_id: Number.isFinite(resolvedUserId) && resolvedUserId > 0 ? resolvedUserId : undefined
        })
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthState();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  const accountName = useMemo(() => {
    const cachedUsername = localStorage.getItem("username");
    if (cachedUsername) {
      return cachedUsername;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.username || user?.name || "Guest";
    } catch {
      return "Guest";
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token") && !localStorage.getItem("labToken")) {
      navigate("/login", { replace: true });
      return;
    }

    // Convert browser Back from dashboard into a login navigation that clears forward history.
    const handlePopState = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <nav className="dash-nav">
        <span className="dash-nav-brand">OWASP Labs</span>
        <div className="dash-nav-right">
          <span className="dash-nav-tag">Security Training Platform</span>
          <span className="dash-account-name" title={accountName}>Account: {accountName}</span>
          <button className="dash-logout-btn" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </nav>

      <div className="dash-hero">
        <div className="dash-hero-label">Learning by Discovery</div>
        <h1>
          Real vulnerabilities.<br />
          <em>Guided exploration.</em>
        </h1>
        <p className="dash-hero-sub">
          Each module teaches you to think like an attacker. Start with real-world scenarios, discover patterns, and understand why security matters.
        </p>
      </div>

      <div className="dash-grid">
        {vulnerabilityCategories.map((category) => (
          <div 
            key={category.num} 
            className={`vuln-card ${category.accent ? "accent" : ""} color-${category.color}`}
          >
            <div className="vuln-card-header">
              <div className="vuln-card-num">{category.num}</div>
              <div className="vuln-icon">{category.icon}</div>
            </div>

            <h2>{category.title}</h2>
            <p className="vuln-tagline">{category.tagline}</p>
            <p className="vuln-desc">{category.desc}</p>

            <div className="vuln-card-footer">
              <Link to={category.to}>
                <button className="cyber-button">{category.label} →</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-footer">
        <p>💡 <strong>Start your security journey:</strong> Each module combines theory with hands-on practice. Work through the labs at your own pace.</p>
      </div>
    </div>
  );
}

export default Dashboard;
