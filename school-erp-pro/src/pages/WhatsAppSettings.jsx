import { PageHeading } from "../design/SchoolUI";

export default function WhatsAppSettings() {
  return <div className="core-page"><PageHeading title="WhatsApp connection" description="Device composers are available from Attendance and Parent Communications." /><section className="school-panel workflow-panel"><h3>Provider integration pending</h3><p>Automatic sending requires an approved server-side messaging provider. Store provider credentials in secure server environment variables, never in this browser.</p><p>No provider connection or delivery verification is active. Existing school records are retained.</p></section></div>;
}
