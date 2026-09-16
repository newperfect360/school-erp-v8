import { useState } from "react";

export default function WhatsAppSettings() {
  const [form, setForm] = useState({
    provider: "Local wa.me Link",
    apiUrl: "",
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    testMobile: "",
    testMessage: "School ERP WhatsApp Test Message",
  });

  const change = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const saveSettings = () => {
    localStorage.setItem("whatsappSettings", JSON.stringify(form));
    alert("WhatsApp API Settings Save झाले.");
  };

  const testWhatsApp = () => {
    if (!form.testMobile || form.testMobile.length < 10) {
      alert("मोबाईल नंबर चुकीचा आहे.");
      return;
    }

    const mobile = "91" + form.testMobile.slice(-10);
    const msg = encodeURIComponent(form.testMessage);
    const url = `https://wa.me/${mobile}?text=${msg}`;

    window.open(url, "_blank");
  };

  const resetSettings = () => {
    setForm({
      provider: "Local wa.me Link",
      apiUrl: "",
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      testMobile: "",
      testMessage: "School ERP WhatsApp Test Message",
    });
  };

  return (
    <div className="page">
      <h2>📲 WhatsApp API Settings</h2>

      <div className="form-grid">
        <label>
          Provider
          <select name="provider" value={form.provider} onChange={change}>
            <option>Local wa.me Link</option>
            <option>Meta Cloud API</option>
            <option>Twilio WhatsApp</option>
            <option>WATI</option>
            <option>Interakt</option>
          </select>
        </label>

        <label>
          WhatsApp API URL
          <input
            name="apiUrl"
            placeholder="WhatsApp API URL"
            value={form.apiUrl}
            onChange={change}
          />
        </label>

        <label>
          Access Token
          <input
            name="accessToken"
            placeholder="Access Token"
            value={form.accessToken}
            onChange={change}
          />
        </label>

        <label>
          Phone Number ID
          <input
            name="phoneNumberId"
            placeholder="Phone Number ID"
            value={form.phoneNumberId}
            onChange={change}
          />
        </label>

        <label>
          Business Account ID
          <input
            name="businessAccountId"
            placeholder="Business Account ID"
            value={form.businessAccountId}
            onChange={change}
          />
        </label>

        <label>
          Test Mobile Number
          <input
            name="testMobile"
            placeholder="उदा. 7507514475"
            value={form.testMobile}
            onChange={change}
            maxLength="10"
          />
        </label>

        <label>
          Test Message
          <textarea
            name="testMessage"
            placeholder="Test Message"
            value={form.testMessage}
            onChange={change}
          />
        </label>
      </div>

      <br />

      <button onClick={saveSettings}>Save WhatsApp Settings</button>
      <button onClick={testWhatsApp}>Test WhatsApp</button>
      <button onClick={resetSettings}>Reset</button>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>महत्त्वाची सूचना</h3>
        <p>
          सध्या Test साठी WhatsApp Web Link वापरली आहे. PDF Auto पाठवण्यासाठी
          Meta Cloud API / WATI / Interakt सारखी WhatsApp Business API सेवा
          जोडावी लागेल.
        </p>
      </div>
    </div>
  );
}
