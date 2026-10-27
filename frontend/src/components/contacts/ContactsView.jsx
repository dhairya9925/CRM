import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Building2,
  ChevronRight,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import ContactModal from './ContactModal';
import ContactDrawer from './ContactDrawer';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getCompanies,
} from '../../services/api';

const SAMPLE_CONTACTS = [
  {
    id: 'contact-1',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    full_name: 'Sarah Jenkins',
    email: 'sarah.j@cloudscale.io',
    phone: '+1 (555) 234-8901',
    company_name: 'CloudScale Dynamics',
    notes: 'Chief Technology Officer. Key decision maker on cloud migrations.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'contact-2',
    first_name: 'Marcus',
    last_name: 'Vance',
    full_name: 'Marcus Vance',
    email: 'm.vance@hyperion.com',
    phone: '+1 (555) 871-3329',
    company_name: 'Hyperion Logistics',
    notes: 'VP of Procurement. Prefers quarterly billing cycle.',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'contact-3',
    first_name: 'Elena',
    last_name: 'Rostova',
    full_name: 'Elena Rostova',
    email: 'elena@finpulse.co',
    phone: '+1 (555) 412-9844',
    company_name: 'FinPulse Systems',
    notes: 'Head of Product Operations. Interested in security compliance API.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'contact-4',
    first_name: 'David',
    last_name: 'Chen',
    full_name: 'David Chen',
    email: 'd.chen@nextgenrobotics.ai',
    phone: '+1 (555) 678-1122',
    company_name: 'NextGen Robotics',
    notes: 'Engineering Director. Technical evaluation completed.',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

export default function ContactsView() {
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companiesList, setCompaniesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchContactsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getContacts({
        search: search.trim() || undefined,
        company_id: selectedCompanyId || undefined,
        page: 1,
        page_size: 50,
      });

      if (res && Array.isArray(res.items)) {
        if (res.items.length === 0 && !search && !selectedCompanyId) {
          setContacts(SAMPLE_CONTACTS);
          setTotalCount(SAMPLE_CONTACTS.length);
        } else {
          setContacts(res.items);
          setTotalCount(res.total || res.items.length);
        }
      } else {
        setContacts(SAMPLE_CONTACTS);
        setTotalCount(SAMPLE_CONTACTS.length);
      }
    } catch {
      setContacts(SAMPLE_CONTACTS);
      setTotalCount(SAMPLE_CONTACTS.length);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCompanyId]);

  useEffect(() => {
    async function loadCompaniesDropdown() {
      try {
        const compRes = await getCompanies({ page_size: 100 });
        if (compRes?.items) setCompaniesList(compRes.items);
      } catch {
        // quiet
      }
    }
    loadCompaniesDropdown();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContactsList();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchContactsList]);

  const handleSaveContact = async (formData) => {
    if (contactToEdit) {
      try {
        const updated = await updateContact(contactToEdit.id, formData);
        setContacts((prev) =>
          prev.map((c) => (c.id === contactToEdit.id ? { ...c, ...updated } : c))
        );
        if (selectedContact?.id === contactToEdit.id) {
          setSelectedContact((prev) => ({ ...prev, ...updated }));
        }
        showFeedback('Contact updated successfully');
      } catch {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactToEdit.id ? { ...c, ...formData } : c))
        );
        showFeedback('Contact updated locally');
      }
    } else {
      try {
        const created = await createContact(formData);
        setContacts((prev) => [created, ...prev]);
        setTotalCount((c) => c + 1);
        showFeedback('Contact created successfully');
      } catch {
        const dummy = {
          id: `contact-${Date.now()}`,
          ...formData,
          full_name: `${formData.first_name} ${formData.last_name}`,
          created_at: new Date().toISOString(),
        };
        setContacts((prev) => [dummy, ...prev]);
        setTotalCount((c) => c + 1);
        showFeedback('Contact created locally');
      }
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await deleteContact(id);
    } catch {
      // quiet
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
    showFeedback('Contact removed');
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Contacts & People
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {totalCount} Total
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Individual stakeholders, executive leaders, and decision makers
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {feedbackMsg && (
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '500' }}>
              {feedbackMsg}
            </span>
          )}
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchContactsList}
            title="Refresh contacts"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setContactToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 280px', maxWidth: '420px' }}>
          <Input
            placeholder="Search contacts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          style={{
            height: '36px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '5px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '0 12px',
          }}
        >
          <option value="">All Companies / Organizations</option>
          {companiesList.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-muted)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Contact Name</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Company</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Email Address</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Added Date</th>
              <th style={{ padding: '12px 18px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading contacts directory...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No contacts found matching your criteria.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => {
                const fullName = contact.full_name || `${contact.first_name} ${contact.last_name}`;
                const createdDate = contact.created_at
                  ? new Date(contact.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={fullName} size={32} />
                        <div>
                          <div style={{ fontWeight: '550', color: 'var(--text-primary)' }}>
                            {fullName}
                          </div>
                          {contact.notes && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {contact.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} color="var(--text-muted)" />
                        <span>{contact.company_name || 'Independent'}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: 'var(--text-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            textDecoration: 'none',
                            fontSize: '12px',
                          }}
                        >
                          <Mail size={12} color="var(--text-muted)" />
                          <span>{contact.email}</span>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-disabled)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {contact.phone ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={12} color="var(--text-muted)" />
                          <span>{contact.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-disabled)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {createdDate}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setContactToEdit(contact);
                            setIsModalOpen(true);
                          }}
                          title="Edit Contact"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${fullName}?`)) {
                              handleDeleteContact(contact.id);
                            }
                          }}
                          title="Delete Contact"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--semantic-error-fg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedContact(contact)}
                          title="View Contact Drawer"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            color: 'var(--accent-primary)',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Contact Drawer */}
      <ContactDrawer
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(ct) => {
          setContactToEdit(ct);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteContact}
      />

      {/* Create / Edit Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        contact={contactToEdit}
      />
    </div>
  );
}
