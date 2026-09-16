import { useState } from "react";
import { readStored, writeStored } from "../storage";

export default function Settings({ onSaved }) {
  const [settings, setSettings] = useState(() => readStored("schoolSettings", {
    schoolName: "स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय",
    sansthaName: "स्व. अमानउल्ला मोतीवाला शिक्षण प्रसारक मंडळ, औरंगाबाद",
    address: "नायगाव (भिकापूर), ता. जि. छत्रपती संभाजीनगर",
    principal: "",
    whatsappApiUrl: "",
    whatsappToken: "",
    smsApiUrl: "",
    smsSenderId: "",
    email: "",
    website: "",
    logo: "",
  }));

  const change = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      if (!files?.[0]) return;
      if (!files[0].type.startsWith("image/") || files[0].size > 2 * 1024 * 1024) { alert("2 MB पेक्षा लहान image निवडा"); return; }
      const reader = new FileReader();
      reader.onload = () => setSettings(current => ({ ...current, logo: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const save = () => {
    if (!writeStored("schoolSettings", settings)) return;
    onSaved?.(settings);
    alert("Settings Save झाले");
  };

  const testWhatsApp = () => {
    const mobile = prompt("Test WhatsApp Mobile Number टाका");
    if (!mobile) return;
    const msg = "School ERP WhatsApp Test Message";
    if (!/^(?:\+?91)?\d{10}$/.test(mobile.trim())) { alert("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <h2>⚙️ School + WhatsApp + SMS Settings</h2>

      <div className="form-grid">
        <input name="sansthaName" placeholder="संस्थेचे नाव" value={settings.sansthaName} onChange={change} />
        <input name="schoolName" placeholder="शाळेचे नाव" value={settings.schoolName} onChange={change} />
        <input name="address" placeholder="पत्ता" value={settings.address} onChange={change} />
        <input name="principal" placeholder="मुख्याध्यापक नाव" value={settings.principal} onChange={change} />
        <input name="email" placeholder="Email" value={settings.email} onChange={change} />
        <input name="website" placeholder="Website" value={settings.website} onChange={change} />
        <input name="whatsappApiUrl" placeholder="WhatsApp API URL" value={settings.whatsappApiUrl} onChange={change} />
        <input type="password" name="whatsappToken" placeholder="WhatsApp API Token" value={settings.whatsappToken} onChange={change} />
        <input name="smsApiUrl" placeholder="SMS API URL" value={settings.smsApiUrl} onChange={change} />
        <input name="smsSenderId" placeholder="SMS Sender ID" value={settings.smsSenderId} onChange={change} />
        <input type="file" name="logo" accept="image/*" onChange={change} />
      </div>

      {settings.logo && <img src={settings.logo} width="100" alt="logo" />}

      <br />
      <button onClick={save}>Save Settings</button>
      <button onClick={testWhatsApp}>Test WhatsApp</button>
    </div>
  );
}
