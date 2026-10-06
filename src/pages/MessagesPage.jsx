import { useEffect, useRef, useState } from 'react';
import * as messagingApi from '../api/messaging.js';
import * as customersApi from '../api/customers.js';
import { ApiError } from '../api/client.js';
import styles from './MessagesPage.module.css';

const UNREAD_POLL_MS = 30000;
const THREAD_POLL_MS = 6000;

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const [showStartForm, setShowStartForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [startForm, setStartForm] = useState({ customerId: '', body: '' });
  const [startError, setStartError] = useState(null);
  const [starting, setStarting] = useState(false);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  async function loadConversations() {
    try {
      setConversations(await messagingApi.listConversations());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refreshes the list (and therefore each row's unread state) on an
  // interval - cheap enough at this scale and avoids needing a separate
  // unread-count badge fetch, since the list already carries that data.
  useEffect(() => {
    const timer = setInterval(loadConversations, UNREAD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  async function openConversation(id) {
    setSelectedId(id);
    setThreadLoading(true);
    setSendError(null);
    try {
      setThread(await messagingApi.getConversation(id));
      // Opening a thread marks it read server-side - reflect that locally
      // without waiting for the next list poll.
      setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, staffUnread: false } : c)));
    } catch {
      setThread(null);
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedId) return undefined;
    const timer = setInterval(async () => {
      try {
        const latest = await messagingApi.getConversation(selectedId);
        if (selectedIdRef.current === selectedId) setThread(latest);
      } catch {
        // A transient poll failure isn't worth surfacing - the next tick retries.
      }
    }, THREAD_POLL_MS);
    return () => clearInterval(timer);
  }, [selectedId]);

  async function handleReply(e) {
    e.preventDefault();
    if (!replyBody.trim() || !selectedId) return;
    setSending(true);
    setSendError(null);
    try {
      await messagingApi.replyToConversation(selectedId, replyBody.trim());
      setReplyBody('');
      setThread(await messagingApi.getConversation(selectedId));
      await loadConversations();
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function openStartForm() {
    setShowStartForm(true);
    setStartError(null);
    setStartForm({ customerId: '', body: '' });
    try {
      setCustomers(await customersApi.listCustomers());
    } catch {
      setCustomers([]);
    }
  }

  async function handleStart(e) {
    e.preventDefault();
    setStarting(true);
    setStartError(null);
    try {
      const result = await messagingApi.startConversation(startForm.customerId, startForm.body.trim());
      setShowStartForm(false);
      await loadConversations();
      await openConversation(result.conversation._id);
    } catch (err) {
      setStartError(err instanceof ApiError ? err.message : 'Failed to start conversation.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        <button type="button" className="btn btn-primary" onClick={openStartForm}>
          New message
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showStartForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleStart}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="msg-customer">Customer</label>
              <select
                id="msg-customer"
                className="select"
                value={startForm.customerId}
                onChange={(e) => setStartForm({ ...startForm, customerId: e.target.value })}
                required
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="msg-body">Message</label>
            <textarea
              id="msg-body"
              className="textarea"
              rows={3}
              value={startForm.body}
              onChange={(e) => setStartForm({ ...startForm, body: e.target.value })}
              required
            />
          </div>
          {startError && <p className="error-text">{startError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={starting}>
              {starting ? 'Sending…' : 'Send'}
            </button>
            <button type="button" className="btn" onClick={() => setShowStartForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.layout}>
        <div className={`card ${styles.list}`}>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="empty-state">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c._id}
                type="button"
                className={`${styles.row} ${selectedId === c._id ? styles.rowActive : ''}`}
                onClick={() => openConversation(c._id)}
              >
                <div className={styles.rowTop}>
                  <span className={styles.rowName}>{c.customerId?.name || 'Unknown customer'}</span>
                  {c.staffUnread && <span className={styles.dot} aria-label="Unread" />}
                </div>
                <div className={styles.rowPreview}>{c.lastMessagePreview}</div>
              </button>
            ))
          )}
        </div>

        <div className={`card ${styles.thread}`}>
          {!selectedId ? (
            <p className="muted">Select a conversation to view messages.</p>
          ) : threadLoading ? (
            <p className="muted">Loading…</p>
          ) : !thread ? (
            <p className="error-text">Failed to load this conversation.</p>
          ) : (
            <>
              <div className={styles.messages}>
                {thread.messages.map((m) => (
                  <div key={m._id} className={`${styles.message} ${m.senderType === 'staff' ? styles.messageStaff : styles.messageCustomer}`}>
                    <div className={styles.messageMeta}>
                      {m.senderName} · {formatTime(m.createdAt)}
                    </div>
                    <div className={styles.messageBody}>{m.body}</div>
                  </div>
                ))}
              </div>
              <form className={styles.composer} onSubmit={handleReply}>
                <input
                  className="input"
                  placeholder="Type a reply…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !replyBody.trim()}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
              {sendError && <p className="error-text">{sendError}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
