import { useEffect, useState } from "react";
import { readAsset } from "../services/assets";
export default function AssetLink({ asset }) {
  const [url, setUrl] = useState(""), [failed, setFailed] = useState(false);
  useEffect(() => { let cancelled = false, created = ""; if (asset?.id) readAsset(asset.id).then(item => { if (!item) { if (!cancelled) setFailed(true); return; } created = URL.createObjectURL(item.blob); if (cancelled) URL.revokeObjectURL(created); else setUrl(created); }).catch(() => { if (!cancelled) setFailed(true); }); return () => { cancelled = true; if (created) URL.revokeObjectURL(created); }; }, [asset?.id]);
  if (!asset) return <span>—</span>;
  if (typeof asset === "string") return <span>{asset} (legacy filename only)</span>;
  if (failed) return <span>{asset.name} — file missing on this browser</span>;
  return url ? <div>{asset.type.startsWith("audio/") && <audio controls src={url} preload="none" />}<a href={url} download={asset.name}>{asset.name}</a></div> : <span>Loading file…</span>;
}
