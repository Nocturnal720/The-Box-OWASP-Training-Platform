function Modules() {
  const modules = [
    "1. Broken Access Control",
    "2. Cryptographic Failures",
    "3. Injection",
    "4. Security Misconfiguration",
    "5. Vulnerable and Outdated Components",
    "6. Identification and Authentication Failures",
    "7. Software and Data Integrity Failures",
    "8. Security Logging and Monitoring Failures",
    "9. Server-Side Request Forgery (SSRF)",
    "10. Insecure Design"
  ];

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>OWASP Top 10 Modules</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {modules.map((item, index) => (
          <li
            key={index}
            style={{
              background: "#111",
              color: "#0f0",
              margin: "10px auto",
              padding: "10px",
              width: "300px",
              cursor: "pointer",
              borderRadius: "5px"
            }}
            onClick={() => alert(`You clicked ${item}`)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Modules;
