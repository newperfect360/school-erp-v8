import { notify } from "../components/Feedback";
import { useState } from "react";
import { readStored, writeStored } from "../storage";

export default function Settings({ onSaved }) {
  const [imageLoading, setImageLoading] = useState(false);
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
      if (!files[0].type.startsWith("image/") || files[0].size > 2 * 1024 * 1024) { notify("2 MB पेक्षा लहान image निवडा"); return; }
      setImageLoading(true);
      const reader = new FileReader();
      reader.onerror = () => { setImageLoading(false); notify("फोटो वाचता आला नाही. पुन्हा निवडा."); };
      reader.onload = () => { setSettings(current => ({ ...current, logo: reader.result })); setImageLoading(false); };
      reader.readAsDataURL(files[0]);
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const save = () => {
    if (imageLoading) { notify("फोटो तयार होत आहे. क्षणभर थांबा."); return; }
    if (!writeStored("schoolSettings", settings)) return;
    onSaved?.(settings);
    notify("Settings Save झाले");
  };

  const testWhatsApp = () => {
    const mobile = prompt("Test WhatsApp Mobile Number टाका");
    if (!mobile) return;
    const msg = "School ERP WhatsApp Test Message";
    if (!/^(?:\+?91)?\d{10}$/.test(mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>शाळेच्या सेटिंग्ज</h2><p>शाळेची माहिती आणि संपर्क configuration</p></div></div>

      <div className="form-grid">
        <label>संस्थेचे नाव<input name="sansthaName" placeholder="संस्थेचे नाव" value={settings.sansthaName} onChange={change} /></label>
        <label>शाळेचे नाव<input name="schoolName" placeholder="शाळेचे नाव" value={settings.schoolName} onChange={change} /></label>
        <label>पत्ता<input name="address" placeholder="पत्ता" value={settings.address} onChange={change} /></label>
        <label>मुख्याध्यापक नाव<input name="principal" placeholder="मुख्याध्यापक नाव" value={settings.principal} onChange={change} /></label>
        <label>Email<input name="email" placeholder="Email" value={settings.email} onChange={change} /></label>
        <label>Website<input name="website" placeholder="Website" value={settings.website} onChange={change} /></label>
        <label>WhatsApp API URL<input name="whatsappApiUrl" placeholder="WhatsApp API URL" value={settings.whatsappApiUrl} onChange={change} /></label>
        <label>WhatsApp API Token<input type="password" name="whatsappToken" placeholder="WhatsApp API Token" value={settings.whatsappToken} onChange={change} /></label>
        <label>SMS API URL<input name="smsApiUrl" placeholder="SMS API URL" value={settings.smsApiUrl} onChange={change} /></label>
        <label>SMS Sender ID<input name="smsSenderId" placeholder="SMS Sender ID" value={settings.smsSenderId} onChange={change} /></label>
        <input type="file" name="logo" accept="image/*" onChange={change} />
      </div>

      {settings.logo && <img src={settings.logo} width="100" alt="logo" />}

      <br />
      <button disabled={imageLoading} onClick={save}>Save Settings</button>
      <button onClick={testWhatsApp}>Test WhatsApp</button>
    </div>
  );
}
