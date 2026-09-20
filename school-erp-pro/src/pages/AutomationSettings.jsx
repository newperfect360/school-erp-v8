import AutomationControls from '../components/AutomationControls';
import {PageHeading} from '../design/SchoolUI';
import {readStored} from '../storage';
export default function AutomationSettings(){return <div className="core-page"><PageHeading title="Attendance & Communication Settings" description="School timing, trial classes, bilingual templates and dry-run notification logs."/><AutomationControls/><details><summary>Previous automation configuration (retained)</summary><pre>{JSON.stringify(readStored('erp_pro_message_settings',{}),null,2)}</pre></details></div>}
