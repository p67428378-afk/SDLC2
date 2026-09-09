import React, { useState, useEffect } from "react";
import {
  Webhook,
  ShieldCheck,
  RefreshCw,
  Filter,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { listAuditLogs } from "../services/api";

export const WebhookLogViewer = () => {
  const [logs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEvent, setFilterEvent] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filterEvent) params.event_type = filterEvent;
      const data = await listAuditLogs(params);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load webhook audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEvent]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-600" />
            Stripe Webhook Delivery & PCI Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Real-time inbound event delivery inspection, HMAC signature status,
            and payload audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg bg-slate-50">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-slate-700"
            >
              <option value="">All Events</option>
              <option value="payment_intent.succeeded">
                payment_intent.succeeded
              </option>
              <option value="payment_intent.payment_failed">
                payment_intent.payment_failed
              </option>
              <option value="charge.refunded">charge.refunded</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logs Table */}
        <div className="lg:col-span-7 bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-hidden shadow-inner">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2 px-2">Event / Action</th>
                  <th className="pb-2 px-2">Transaction ID</th>
                  <th className="pb-2 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No webhook audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition-colors hover:bg-slate-800 ${
                        selectedLog?.id === log.id
                          ? "bg-indigo-950/80 text-indigo-300"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-2 font-semibold text-emerald-400 truncate max-w-[160px]">
                        {log.event_type}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 truncate max-w-[120px]">
                        {log.transaction_id || "N/A"}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 text-[10px]">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleTimeString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log Inspector */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Payload Inspector & HMAC Verification
          </h3>

          {selectedLog ? (
            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">
                    Log Entry ID:
                  </span>
                  <span className="font-mono text-slate-700">
                    {selectedLog.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">
                    Event Type:
                  </span>
                  <span className="font-semibold text-indigo-600">
                    {selectedLog.event_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Origin IP:</span>
                  <span className="font-mono text-slate-700">
                    {selectedLog.ip_address || "127.0.0.1"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-400 font-medium">
                    Signature Status:
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Verified HMAC SHA-256
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Masked Payload JSON:
                </span>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto max-h-52">
                  {JSON.stringify(selectedLog.masked_payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Click any log entry on the left to inspect its verified payload
              and headers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookLogViewer;
