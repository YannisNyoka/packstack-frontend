import { useEffect, useState } from 'react';
import * as domainsApi from '../../api/domains.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';

const SSL_BADGE = { pending: 'badge-neutral', issued: 'badge-success', failed: 'badge-danger' };

export function DomainsSettingsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
  const [error, setError] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(null);
  const [pendingInstructions, setPendingInstructions] = useState(null); // { domain, dnsInstructions }

  async function load() {
    setLoading(true);
    try {
      setDomains(await domainsApi.listDomains());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load domains.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const result = await domainsApi.addDomain(newDomain);
      setPendingInstructions(result);
      setNewDomain('');
      await load();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to add domain.');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domain) {
    setVerifyingDomain(domain);
    setError(null);
    try {
      const result = await domainsApi.verifyDomain(domain);
      // Ownership (TXT) can be verified while Vercel routing still isn't set
      // up yet - show those instructions instead of clearing the callout.
      setPendingInstructions(result.vercelDnsInstructions ? { domain, vercelDnsInstructions: result.vercelDnsInstructions } : null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setVerifyingDomain(null);
    }
  }

  async function handleRemove(domain) {
    if (!window.confirm(`Remove ${domain}? Visitors there will no longer reach your site.`)) return;
    try {
      await domainsApi.removeDomain(domain);
      if (pendingInstructions?.domain === domain) setPendingInstructions(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove domain.');
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Custom domains</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Point your own domain at PackStack instead of using a packstack.co.za subdomain.
      </p>

      <form style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }} onSubmit={handleAdd}>
        <div className="field" style={{ marginBottom: 0, flex: 1, maxWidth: 320 }}>
          <label htmlFor="new-domain">Domain</label>
          <input
            id="new-domain"
            className="input"
            placeholder="yourbusiness.co.za"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={adding}>
          {adding ? 'Adding…' : 'Add domain'}
        </button>
      </form>
      {addError && <p className="error-text">{addError}</p>}

      {pendingInstructions?.dnsInstructions && (
        <div className="card" style={{ boxShadow: 'none', marginBottom: 16, background: 'var(--color-warning-bg)' }}>
          <p style={{ margin: '0 0 6px' }}>
            Add this TXT record to verify you own <strong>{pendingInstructions.domain}</strong>:
          </p>
          <code style={{ display: 'block', fontSize: 13 }}>
            {pendingInstructions.dnsInstructions.host} → {pendingInstructions.dnsInstructions.value}
          </code>
        </div>
      )}

      {pendingInstructions?.vercelDnsInstructions && (
        <div className="card" style={{ boxShadow: 'none', marginBottom: 16, background: 'var(--color-warning-bg)' }}>
          <p style={{ margin: '0 0 6px' }}>
            Ownership verified. Now point <strong>{pendingInstructions.domain}</strong> at PackStack so it actually
            serves your site - add whichever of these matches your domain, then click Verify again:
          </p>
          <code style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
            If it's a root domain (e.g. {pendingInstructions.domain}): {pendingInstructions.vercelDnsInstructions.apex.type}{' '}
            {pendingInstructions.vercelDnsInstructions.apex.host} → {pendingInstructions.vercelDnsInstructions.apex.value}
          </code>
          <code style={{ display: 'block', fontSize: 13 }}>
            If it's a subdomain (e.g. book.{pendingInstructions.domain}):{' '}
            {pendingInstructions.vercelDnsInstructions.subdomain.type} {pendingInstructions.vercelDnsInstructions.subdomain.host} →{' '}
            {pendingInstructions.vercelDnsInstructions.subdomain.value}
          </code>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : domains.length === 0 ? (
        <p className="empty-state">No custom domains yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Verification</th>
              <th>SSL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {domains.map((mapping) => (
              <tr key={mapping._id}>
                <td>{mapping.domain}</td>
                <td>
                  <span className={`badge ${mapping.verified ? 'badge-success' : 'badge-warning'}`}>
                    {mapping.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${SSL_BADGE[mapping.sslStatus] || 'badge-neutral'}`}>{mapping.sslStatus}</span>
                </td>
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {mapping.sslStatus !== 'issued' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={verifyingDomain === mapping.domain}
                      onClick={() => handleVerify(mapping.domain)}
                    >
                      {verifyingDomain === mapping.domain ? 'Checking…' : mapping.verified ? 'Check SSL status' : 'Verify'}
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemove(mapping.domain)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
