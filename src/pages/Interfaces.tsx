import { useEffect, useState } from "react";
import { interfaceService, type SourceInterface } from "../data/interfaces";

export default function Interfaces() {
  const [items, setItems] = useState<SourceInterface[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    interfaceService.list().then((loaded) => {
      if (active) setItems(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  async function toggle(entry: SourceInterface, enabled: boolean) {
    setBusy(entry.id);
    setError(null);
    try {
      const updated = await interfaceService.setEnabled(entry.id, enabled);
      setItems((current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
      );
    } catch {
      setError(`Could not update ${entry.name}. Try again.`);
    } finally {
      setBusy(null);
    }
  }

  const enabledCount = items?.filter((item) => item.enabled).length ?? 0;

  return (
    <>
      <div className="page-head">
        <h2>Interfaces</h2>
        <p>
          Choose which systems ReconFlow reads from for your organisation.
          Turning an interface off stops ingestion from it; records already
          reconciled are kept.
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {items === null ? (
        <p className="count">Loading interfaces…</p>
      ) : (
        <>
          <div className="iface-toolbar">
            <span className="count">
              {enabledCount} of {items.length} enabled
            </span>
          </div>

          <div className="iface-list">
            {items.map((entry) => (
              <div className="iface-row" key={entry.id}>
                <div>
                  <div className="iface-name">
                    {entry.name}
                    {entry.kind === "proprietary" && (
                      <span className="tag tag-proprietary">Proprietary</span>
                    )}
                    <span className="tag">{entry.category}</span>
                  </div>
                  <p className="iface-meta">{entry.description}</p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    disabled={busy === entry.id}
                    onChange={(event) => void toggle(entry, event.target.checked)}
                  />
                  <span className="switch-track" />
                  <span className="sr-only">
                    Enable {entry.name}
                  </span>
                  <span aria-hidden="true">
                    {entry.enabled ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>
            ))}
          </div>

          <p className="note">
            Need a system that is not listed? ReconFlow is neutral about source
            systems — a proprietary adaptor can be built for anything your
            organisation runs.
          </p>
        </>
      )}
    </>
  );
}
